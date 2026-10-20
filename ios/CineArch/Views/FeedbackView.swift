import SwiftUI
import Supabase

// Feedback to the developers, from Account. Each note goes to public.feedback
// with where in the app it's about; the sender sees their notes and whether
// the team has read them. Up to 10 a day.

struct FeedbackNote: Codable, Identifiable, Hashable {
    var id: UUID?
    var kind: String
    var message: String
    var screen: String?
    var platform = "ios"
    var appVersion: String?
    var status: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, kind, message, screen, platform, status
        case appVersion = "app_version", createdAt = "created_at"
    }

    /// Leaves out what the database fills in, so an insert can't set them.
    struct Insert: Encodable { var kind, message: String; var screen: String?; var platform: String; var app_version: String? }

    var statusLabel: String {
        switch status { case "read": "Read by the team"; case "done": "Done"; default: "Sent" }
    }
}

struct FeedbackView: View {
    @Environment(Session.self) private var session
    @State private var kind = "problem"
    @State private var screen = "Anywhere"
    @State private var message = ""
    @State private var sending = false
    @State private var sent = false
    @State private var error: String?
    @State private var notes: [FeedbackNote] = []
    @FocusState private var writing: Bool

    static let kinds = [("problem", "Something's wrong"), ("idea", "An idea"), ("praise", "Something I like")]
    static let screens = ["Anywhere", "Your Wrap", "Slate", "Guide", "Pay calculator", "Wrap Wallet", "Account", "Signing in"]
    private let limit = 2000
    private var trimmed: String { message.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var version: String? {
        let info = Bundle.main.infoDictionary
        guard let short = info?["CFBundleShortVersionString"] as? String else { return nil }
        return (info?["CFBundleVersion"] as? String).map { "\(short) (\($0))" } ?? short
    }

    var body: some View {
        Form {
            Section("What's it about?") {
                Picker("Kind", selection: $kind) {
                    ForEach(Self.kinds, id: \.0) { Text($0.1).tag($0.0) }
                }
                .pickerStyle(.inline).labelsHidden()
                Picker("Where in the app", selection: $screen) {
                    ForEach(Self.screens, id: \.self) { Text($0) }
                }
            }

            Section {
                TextField(placeholder, text: $message, axis: .vertical)
                    .lineLimit(5...12).focused($writing)
                    .onChange(of: message) { _, new in if new.count > limit { message = String(new.prefix(limit)) } }
            } header: { Text("Your note") } footer: {
                Text("\(message.count) of \(limit) characters. It goes to the CineArch team with your account email, so we can reply.")
            }

            Section {
                Button {
                    Task { await send() }
                } label: {
                    HStack {
                        Spacer()
                        if sending { ProgressView() } else { Text(sent ? "Sent. Thank you" : "Send to the team").bold() }
                        Spacer()
                    }
                }
                .disabled(trimmed.isEmpty || sending || session.isPreview)
            } footer: {
                if session.isPreview { Text("Sending is off in the sample account. Sign in to send a note.") }
                else if let error { Text(error).foregroundStyle(.red) }
                else { Text("Up to 10 notes a day. For anything urgent, use Support on the Account tab.") }
            }

            if !notes.isEmpty {
                Section("Your notes") {
                    ForEach(notes) { n in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(n.message).lineLimit(3)
                            HStack {
                                Text(Self.kinds.first { $0.0 == n.kind }?.1 ?? n.kind)
                                if let s = n.screen { Text("· \(s)") }
                                Spacer()
                                Text(n.statusLabel).foregroundStyle(n.status == "new" || n.status == nil ? Color.secondary : Theme.accent)
                            }
                            .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Send feedback")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Done") { writing = false } } }
        .task { await load() }
        .onChange(of: kind) { sent = false }
        .onChange(of: message) { if !message.isEmpty { sent = false } }
    }

    private var placeholder: String {
        switch kind {
        case "idea": "What would make CineArch more useful on set?"
        case "praise": "What's working well for you?"
        default: "What happened, and what did you expect?"
        }
    }

    private func load() async {
        guard !session.isPreview, Backend.client.auth.currentUser != nil else { return }
        notes = (try? await Backend.client.from("feedback").select().order("created_at", ascending: false).limit(20).execute().value) ?? []
    }

    private func send() async {
        sending = true
        defer { sending = false }
        do {
            let row = FeedbackNote.Insert(kind: kind, message: trimmed, screen: screen == "Anywhere" ? nil : screen,
                                          platform: "ios", app_version: version)
            let saved: FeedbackNote = try await Backend.client.from("feedback").insert(row).select().single().execute().value
            notes.insert(saved, at: 0)
            message = ""; writing = false; error = nil; sent = true
        } catch {
            self.error = "\(error)".contains("FEEDBACK_LIMIT")
                ? "That's 10 notes today. Thank you! Send more tomorrow."
                : "Couldn't send. Check your connection and try again; your note is still here."
        }
    }
}

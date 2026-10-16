import SwiftUI

// Notes from set, opened from the bell on Your Wrap.
struct NotesView: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    let notes: [Note]
    @State private var dismissed = Notes.dismissed
    @State private var showSlate = false

    var body: some View {
        let visible = notes.filter { !dismissed.contains($0.id) }
        NavigationStack {
            List {
                if visible.isEmpty {
                    Text("All quiet on set. Nothing needs you right now.").foregroundStyle(.secondary)
                }
                ForEach(visible) { n in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(n.title).font(.headline)
                        Text(n.body).font(.subheadline).foregroundStyle(.secondary)
                        HStack(spacing: 10) {
                            Button(n.actionLabel) { Task { await act(n) } }
                                .buttonStyle(.borderedProminent).buttonBorderShape(.roundedRectangle(radius: 0)).foregroundStyle(.black)
                            Button("Dismiss") { Notes.dismiss(n.id); dismissed = Notes.dismissed }
                                .buttonStyle(.bordered).buttonBorderShape(.roundedRectangle(radius: 0))
                        }
                        .font(.caption.bold())
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Notes from set")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
            .sheet(isPresented: $showSlate) { MarkSlateSheet() }
        }
    }

    private func act(_ n: Note) async {
        switch n.action {
        case .openWrap: dismiss()
        case .markSlate: showSlate = true
        case .link(let url): openURL(url)
        case .confirmJob(let id): await jobs.confirm(id)
        }
    }
}

/// The bell on Your Wrap: shows how many notes are waiting.
struct NotesBell: View {
    let count: Int
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: count > 0 ? "bell.badge.fill" : "bell")
                .symbolRenderingMode(.palette).foregroundStyle(Theme.accent, .primary)
        }
        .accessibilityLabel(count > 0 ? "Notes from set: \(count) waiting" : "Notes from set: none waiting")
        .overlay(alignment: .topTrailing) {
            if count > 0 {
                Text("\(count)").font(.caption2.weight(.heavy)).foregroundStyle(.black)
                    .padding(.horizontal, 4).background(Theme.accent).offset(x: 10, y: -8)
            }
        }
    }
}

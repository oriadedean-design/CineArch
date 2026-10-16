import SwiftUI
import Supabase

struct AccountView: View {
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @State private var showAuth = false
    @State private var showScene = false
    @AppStorage(Notes.remindersKey) private var reminders = false
    @State private var showPlans = UserDefaults.standard.bool(forKey: "cinearch.plans")
    @State private var confirmDelete = false
    @State private var typed = ""
    @State private var working = false
    @State private var error: String?
    @State private var name = ""
    @State private var goal = ""
    @State private var saved: String?          // which field just saved, for the tick
    @FocusState private var focus: Field?
    enum Field { case name, goal }

    private let site = URL(string: "https://cine-arch.vercel.app")!
    private var year: String { String(Calendar.current.component(.year, from: Date())) }
    private var earnedThisYear: Double {
        jobs.jobs.filter { $0.status != "TENTATIVE" && $0.startDate.hasPrefix(year) }.reduce(0) { $0 + ($1.grossEarnings ?? 0) }
    }

    var body: some View {
        NavigationStack {
            List {
                if session.isSignedIn {
                    Section {
                        HStack {
                            Text("Your name")
                            TextField("Add your name", text: $name).multilineTextAlignment(.trailing)
                                .textContentType(.name).submitLabel(.done).focused($focus, equals: .name)
                                .onSubmit { Task { await save(.name) } }
                                .disabled(session.isPreview)
                            tick(.name)
                        }
                        LabeledContent(session.isPreview ? "Preview" : "Signed in as", value: session.displayEmail ?? "")
                        if !session.isPreview {
                            Button { showScene = true } label: {
                                LabeledContent("Setting the Scene") {
                                    Text(sceneSummary).foregroundStyle(.secondary)
                                }
                            }
                            .foregroundStyle(.primary)
                        }
                    } header: { Text("You") } footer: {
                        if !session.isPreview { Text("Setting the Scene is where you're based, what you do and who's in your corner.") }
                    }

                    Section {
                        NavigationLink { UnionGoalsView() } label: {
                            LabeledContent("Union goals") {
                                Text(tracking.tracks.isEmpty ? "None yet" : tracking.tracks.map(\.unionName).joined(separator: ", "))
                                    .lineLimit(1).foregroundStyle(.secondary)
                            }
                        }
                        HStack {
                            Text("Earning goal")
                            Spacer()
                            Text("$").foregroundStyle(.secondary)
                            TextField("Not set", text: $goal).keyboardType(.numberPad).multilineTextAlignment(.trailing)
                                .frame(maxWidth: 110).focused($focus, equals: .goal)
                                .disabled(session.isPreview)
                            tick(.goal)
                        }
                    } header: { Text("Your goals") } footer: {
                        if let g = session.profile?.earningGoal, g > 0 {
                            Text("\(earnedThisYear.money) of \(g.money) earned in \(year) (\(Int((earnedThisYear / g * 100).rounded()))%). From film work, before tax.")
                        } else {
                            Text("What you'd like to earn from film work in \(year), before tax. Your Wrap shows how close you are.")
                        }
                    }

                    Section("Plan") {
                        NavigationLink { PlansView() } label: {
                            LabeledContent("Your plan") {
                                Text(session.isPremium ? Plan.pro.name : Plan.indie.name)
                                    .foregroundStyle(session.isPremium ? Theme.accent : .secondary)
                            }
                        }
                        NavigationLink { PlansView() } label: {
                            LabeledContent("Sync Online") {
                                Text(session.isPremium ? "On" : "Off · this iPhone only")
                                    .foregroundStyle(session.isPremium ? Theme.accent : .secondary)
                            }
                        }
                    }
                } else {
                    Section {
                        Button("Sign in or create account") { showAuth = true }
                        Button("Take a look around") { session.startPreview() }
                    } footer: {
                        Text("The guide and pay calculator work without an account. Sign in to mark the slate, or look around a sample A-List Pro account first.")
                    }
                    Section { NavigationLink("What comes with A-List Pro") { PlansView() } }
                }

                if session.isSignedIn {
                    Section {
                        Toggle("Phone reminders", isOn: Binding(get: { reminders }, set: { on in
                            Task { reminders = on ? await Notes.requestPermission() : false }
                        }))
                    } footer: {
                        Text("A 9 a.m. reminder before tax dates and days leaving your union window. Everything else waits in Notes from set on Your Wrap.")
                    }
                }

                Section("CineArch") {
                    Link(destination: site.appending(path: "guide/")) { Label("Union guide on the web", systemImage: "safari") }
                    Link(destination: URL(string: "\(site)/#/privacy")!) { Label("Privacy policy", systemImage: "hand.raised") }
                    Link(destination: URL(string: "\(site)/#/about")!) { Label("Support", systemImage: "questionmark.circle") }
                }

                if session.isSignedIn {
                    Section {
                        Button(session.isPreview ? "Leave preview" : "Sign out") { Task { await session.signOut() } }
                        if !session.isPreview {
                            Button("Delete account", role: .destructive) { typed = ""; confirmDelete = true }
                                .disabled(working)
                        }
                    } footer: {
                        if !session.isPreview {
                            Text("Delete account permanently removes your account and everything in it, on this iPhone and online: jobs, union progress, documents and finance records. This can't be undone.")
                        }
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Save") { Task { if let f = focus { await save(f) } } }
                }
            }
            .onChange(of: focus) { old, _ in if let old { Task { await save(old) } } }
            .task(id: session.identity) {
                async let a: Void = jobs.use(session.place)
                async let b: Void = tracking.use(session.place)
                _ = await (a, b)
                name = session.isPreview ? Sample.name : session.profile?.name ?? ""
                goal = session.profile?.earningGoal.map { $0.formatted(.number.grouping(.never)) } ?? ""
            }
            .navigationTitle("Account")
            .previewBadge()
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .sheet(isPresented: $showScene) { OnboardingView() }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in with your CineArch account, or create one.") {} }
            .alert("Delete your account?", isPresented: $confirmDelete) {
                TextField("Type DELETE", text: $typed).textInputAutocapitalization(.characters)
                Button("Delete permanently", role: .destructive) { Task { await delete() } }
                    .disabled(typed.trimmed != "DELETE")
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your account and all its data are deleted immediately. Type DELETE to confirm.")
            }
        }
    }

    private var sceneSummary: String {
        guard let p = session.profile, p.isOnboarded else { return "Not filled in" }
        return [p.province, p.selectedRoles?.first].compactMap { $0 }.joined(separator: " · ")
    }

    @ViewBuilder private func tick(_ f: Field) -> some View {
        if saved == "\(f)" { Image(systemName: "checkmark").foregroundStyle(Theme.accent).accessibilityLabel("Saved") }
    }

    /// Saves a field when you leave it or tap Save; a tick shows it landed.
    private func save(_ f: Field) async {
        guard !session.isPreview else { return }
        do {
            switch f {
            case .name:
                guard name.trimmed != (session.profile?.name ?? "") else { return }
                try await session.saveProfileField("name", name.trimmed.isEmpty ? .null : .string(name.trimmed))
            case .goal:
                let value = Double(goal.filter(\.isNumber))
                guard value != session.profile?.earningGoal else { return }
                try await session.saveProfileField("earning_goal", value.map { .double($0) } ?? .null)
            }
            error = nil
            saved = "\(f)"
            focus = nil
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }

    private func delete() async {
        working = true
        defer { working = false }
        do { try await session.deleteAccount(); error = nil }
        catch { self.error = "Couldn't delete your account: \(error.localizedDescription). Nothing was deleted; try again." }
    }
}

// Union goals from Account: each union you're working toward, how far along you
// are, tap to change the level or days already banked, swipe to stop tracking.
struct UnionGoalsView: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @Environment(EngineStore.self) private var store
    @State private var editing: TrackedUnion?
    @State private var showAdd = false

    var body: some View {
        let progress = tracking.tracks.map { TrackProgress(track: $0, jobs: jobs.jobs, engine: store.engine) }
        List {
            Section {
                ForEach(progress) { p in
                    Button { editing = p.track } label: { TrackRow(progress: p) }.buttonStyle(.plain)
                }
                .onDelete { idx in
                    let doomed = idx.map { progress[$0].track }
                    Task { for t in doomed { await tracking.remove(t) } }
                }
                Button { showAdd = true } label: { Label("Track a union", systemImage: "plus.square.fill") }
            } footer: {
                Text("Tap a union to change what you're aiming for or add days already banked. Swipe left to stop tracking it.")
            }
            if let e = tracking.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .navigationTitle("Union goals")
        .sheet(isPresented: $showAdd) { TrackUnionSheet(existing: nil) }
        .sheet(item: $editing) { TrackUnionSheet(existing: $0) }
    }
}

// Sign in / create account, shown only when an action needs an account.
struct AuthSheet: View {
    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    let reason: String
    var onSignedIn: () -> Void

    @State private var creating = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var working = false
    @State private var message: String?

    var body: some View {
        NavigationStack {
            List {
                Section { Text(reason).foregroundStyle(.secondary) }
                Section {
                    if creating { TextField("Your name", text: $name).textContentType(.name) }
                    TextField("Email", text: $email)
                        .textContentType(.username).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                    SecureField("Password", text: $password).textContentType(creating ? .newPassword : .password)
                }
                Section {
                    Button(creating ? "Create account" : "Sign in") { Task { await submit() } }
                        .disabled(working || email.trimmed.isEmpty || password.count < 6 || (creating && name.trimmed.isEmpty))
                    Button(creating ? "I already have an account" : "Create an account") { creating.toggle(); message = nil }
                    if !creating {
                        Button("Forgot password?") { Task { await reset() } }.disabled(email.trimmed.isEmpty || working)
                    }
                }
                if let message { Section { Text(message) } }
            }
            .navigationTitle(creating ? "Create account" : "Sign in")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }

    private func submit() async {
        working = true
        defer { working = false }
        do {
            if creating {
                let signedIn = try await session.signUp(name: name.trimmed, email: email.trimmed, password: password)
                if !signedIn { message = "Check your email to confirm your account, then sign in."; creating = false; return }
            } else {
                try await session.signIn(email: email.trimmed, password: password)
            }
            dismiss()
            onSignedIn()
        } catch {
            message = error.localizedDescription
        }
    }

    private func reset() async {
        do { try await session.sendPasswordReset(email: email.trimmed); message = "We sent a reset link to \(email.trimmed)." }
        catch { message = error.localizedDescription }
    }
}

import SwiftUI
import Supabase
import AuthenticationServices
import CryptoKit

enum Features {
    /// Sign in with Apple. Needs a paid Apple Developer account, the Sign in with Apple
    /// capability, and Apple turned on in Supabase. Steps: docs/sign-in-with-apple.md.
    static let signInWithApple = false
}

struct AccountView: View {
    @Environment(Session.self) private var session
    @Environment(RepresentationStore.self) private var representation
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @Environment(LedgerStore.self) private var ledger
    @State private var showAuth = false
    @State private var showScene = false
    @State private var showWalkthrough = false
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
                        PayTypePicker()
                        if !session.isPreview {
                            Button { showScene = true } label: {
                                LabeledContent("Setting the Scene") {
                                    Text(sceneSummary).foregroundStyle(.secondary)
                                }
                            }
                            .foregroundStyle(.primary)
                        }
                    } header: { Text("You") } footer: { Group {
                        if !session.isPreview { Text("How you're paid decides what the Wrap Wallet tells you to set aside for tax. Setting the Scene is where you're based, what you do and who's in your corner.") }
                    }.font(Theme.sans(.footnote)) }

                    Section { walkthroughRow } footer: { Group {
                        Text("A one-minute walkthrough: mark the slate, check your pay, count your days toward your card.")
                    }.font(Theme.sans(.footnote)) }

                    Section {
                        NavigationLink { RepresentationView() } label: {
                            LabeledContent("Your representation") {
                                Text(representation.reps.isEmpty ? "None" : representation.reps.map(\.name).joined(separator: ", "))
                                    .lineLimit(1).foregroundStyle(.secondary)
                            }
                        }
                    } header: {
                        HintedHeader(title: "Industry representation", hint: "Your agents and managers, and the commission each takes. CineArch shows their cut on every job they book (or every job, for a manager) and what you keep.")
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
                            TextField("Not set", text: $goal).keyboardType(.numberPad).numbersOnly($goal, decimals: false).multilineTextAlignment(.trailing)
                                .frame(maxWidth: 110).focused($focus, equals: .goal)
                                .disabled(session.isPreview)
                            tick(.goal)
                        }
                    } header: { Text("Your goals") } footer: { Group {
                        if let g = session.profile?.earningGoal, g > 0 {
                            Text("\(earnedThisYear.money) of \(g.money) earned in \(year) (\(Int((earnedThisYear / g * 100).rounded()))%). From film work, before tax.")
                        } else {
                            Text("What you'd like to earn from film work in \(year), before tax. Your Wrap shows how close you are.")
                        }
                    }.font(Theme.sans(.footnote)) }

                    Section {
                        NavigationLink { PlansView() } label: {
                            LabeledContent("Your plan") {
                                Text(session.isPremium ? Plan.pro.name : Plan.indie.name)
                                    .foregroundStyle(session.isPremium ? Theme.accent : .secondary)
                            }
                        }
                        if session.isPremium {
                            VStack(alignment: .leading, spacing: 6) {
                                LabeledContent("Documents", value: "\(ByteCountFormatter.string(fromByteCount: ledger.usedBytes, countStyle: .file)) of 5 GB")
                                SquareProgress(value: Double(ledger.usedBytes) / Double(Documents.accountLimitBytes))
                            }
                        }
                        NavigationLink { PlansView() } label: {
                            LabeledContent("Sync Online") {
                                Text(session.isPremium ? "On" : "Off · this iPhone only")
                                    .foregroundStyle(session.isPremium ? Theme.accent : .secondary)
                            }
                        }
                    } header: { Text("Plan") } footer: { Group {
                        if session.isPremium { Text("Proof and receipts, up to 1 MB each and 5 GB in all.") }
                    }.font(Theme.sans(.footnote)) }
                } else {
                    Section {
                        Button("Sign in or create account") { showAuth = true }
                        Button("Take a look around") { session.startPreview() }
                        walkthroughRow
                    } footer: { Group {
                        Text("The guide and pay calculator work without an account. Sign in to mark the slate, or look around a sample A-List Pro account first.")
                    }.font(Theme.sans(.footnote)) }
                    Section { NavigationLink("What comes with A-List Pro") { PlansView() } }
                }

                if session.isSignedIn {
                    Section {
                        Toggle("Phone reminders", isOn: Binding(get: { reminders }, set: { on in
                            Task { reminders = on ? await Notes.requestPermission() : false }
                        }))
                        NavigationLink { PermissionsView() } label: { Label("Permissions and scanning", systemImage: "lock.shield") }
                    } footer: { Group {
                        Text("A 9 a.m. reminder before tax dates and days leaving your union window. Everything else waits in Notes from set on Your Wrap.")
                    }.font(Theme.sans(.footnote)) }
                }

                if session.isSignedIn {
                    Section {
                        NavigationLink { FeedbackView() } label: { Label("Send feedback", systemImage: "envelope") }
                    } header: {
                        HintedHeader(title: "Feedback to the developers", hint: "Something wrong, an idea, or something you like. Every note goes straight to the people building CineArch, and you'll see here when it's been read.")
                    } footer: { Group {
                        Text("Tell us what's confusing, broken or missing. Notes say which screen they're about.")
                    }.font(Theme.sans(.footnote)) }
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
                    } footer: { Group {
                        if !session.isPreview {
                            Text("Delete account permanently removes your account and everything in it, on this iPhone and online: jobs, union progress, documents and finance records. This can't be undone.")
                        }
                    }.font(Theme.sans(.footnote)) }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .contentMargins(.bottom, 96, for: .scrollContent)     // clear of the clapperboard
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
                if session.isPremium { await ledger.loadUsage() }
                name = session.isPreview ? Sample.name : session.profile?.name ?? ""
                goal = session.profile?.earningGoal.map { $0.formatted(.number.grouping(.never)) } ?? ""
            }
            .navigationTitle("Account")
            .previewBadge()
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .fullScreenCover(isPresented: $showWalkthrough) { WalkthroughView { showWalkthrough = false } }
            .sheet(isPresented: $showScene, onDismiss: { Task { await representation.load(preview: session.isPreview) } }) { OnboardingView() }
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

    private var walkthroughRow: some View {
        Button { showWalkthrough = true } label: {
            LabeledContent {
                Text("1 min").foregroundStyle(.secondary)
            } label: {
                Label("How CineArch works", systemImage: "play.rectangle.fill")
            }
        }
        .foregroundStyle(.primary)
        .accessibilityHint("Plays the walkthrough")
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
            } footer: { Group {
                Text("Tap a union to change what you're aiming for or add days already banked. Swipe left to stop tracking it.")
            }.font(Theme.sans(.footnote)) }
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
    /// Something to do without an account instead (e.g. the pay calculator).
    var alternative: (String, AnyView)? = nil
    var onSignedIn: () -> Void

    @State private var creating = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var working = false
    @State private var message: String?
    @State private var nonce = ""

    var body: some View {
        NavigationStack {
            List {
                Section { Text(reason).foregroundStyle(.secondary) }
                if Features.signInWithApple {
                    Section {
                        SignInWithAppleButton(creating ? .signUp : .signIn) { request in
                            nonce = Self.randomNonce()
                            request.requestedScopes = [.fullName, .email]
                            request.nonce = Self.sha256(nonce)
                        } onCompletion: { result in Task { await apple(result) } }
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .listRowInsets(EdgeInsets())
                    } footer: { Group { Text("Or use your email below.") }.font(Theme.sans(.footnote)) }
                }
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
                if let alternative {
                    Section { NavigationLink(alternative.0) { alternative.1 } }
                }
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

    private func apple(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let auth):
            guard let cred = auth.credential as? ASAuthorizationAppleIDCredential,
                  let token = cred.identityToken.flatMap({ String(data: $0, encoding: .utf8) }) else {
                message = "Apple didn't send a sign-in token. Try again."; return
            }
            working = true
            defer { working = false }
            do {
                try await session.signInWithApple(idToken: token, nonce: nonce, name: cred.fullName)
                dismiss()
                onSignedIn()
            } catch { message = error.localizedDescription }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled { message = error.localizedDescription }
        }
    }

    private static func randomNonce(length: Int = 32) -> String {
        let chars = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String((0..<length).map { _ in chars[Int.random(in: 0..<chars.count)] })
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    private func reset() async {
        do { try await session.sendPasswordReset(email: email.trimmed); message = "We sent a reset link to \(email.trimmed)." }
        catch { message = error.localizedDescription }
    }
}

// MARK: Your representation

/// The agents and managers you work with, and what each takes.
struct RepresentationView: View {
    @Environment(RepresentationStore.self) private var representation
    @Environment(JobsStore.self) private var jobs
    @State private var editing: Representative?
    @State private var adding = false

    var body: some View {
        List {
            Section {
                ForEach(representation.reps) { r in
                    Button { editing = r } label: {
                        VStack(alignment: .leading, spacing: 3) {
                            HStack {
                                Text(r.name).font(Theme.sans(.headline))
                                Spacer()
                                Text("\(r.commissionPct.formatted(.number.precision(.fractionLength(0...2))))%").font(Theme.serif(.title3)).foregroundStyle(Theme.accent)
                            }
                            Text([r.kindName, r.agency, r.takesFromEveryJob ? "every job" : "jobs they book"].compactMap { $0 }.joined(separator: " · "))
                                .font(Theme.sans(.caption)).foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
                .onDelete { idx in
                    let doomed = idx.map { representation.reps[$0] }
                    Task { for r in doomed { await representation.remove(r) } }
                }
                Button { adding = true } label: { Label("Add an agent or manager", systemImage: "plus.circle.fill") }
            } footer: { Group {
                Text("Agents usually take a percentage of the jobs they book. Managers often take one from every job. Swipe left to remove someone.")
            }.font(Theme.sans(.footnote)) }
            let paid = representation.commissionTotal(jobs.jobs.filter { $0.startDate.hasPrefix(String(Ledger.currentYear)) })
            if paid > 0 {
                Section("This year") {
                    LabeledContent("Commission on your Slate", value: paid.money)
                }
            }
            if let e = representation.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .navigationTitle("Your representation")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $adding) { RepresentativeSheet(rep: nil) }
        .sheet(item: $editing) { RepresentativeSheet(rep: $0) }
    }
}

struct RepresentativeSheet: View {
    @Environment(RepresentationStore.self) private var representation
    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    let rep: Representative?

    @State private var name = ""
    @State private var agency = ""
    @State private var kind = "agent"
    @State private var pct = ""
    @State private var appliesTo = "booked"
    @State private var linked = false
    @State private var saving = false
    @State private var error: String?

    private var pctValue: Double? { Double(pct).flatMap { (0...50).contains($0) ? $0 : nil } }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Name", text: $name).textInputAutocapitalization(.words)
                    TextField("Agency (optional)", text: $agency).textInputAutocapitalization(.words)
                    Picker("Role", selection: $kind) {
                        Text("Agent").tag("agent"); Text("Manager").tag("manager"); Text("Other").tag("other")
                    }
                    if let a = session.agency {
                        Toggle("This is \(a.name) on CineArch", isOn: $linked)
                    }
                }
                Section {
                    HStack {
                        Text("Commission")
                        Spacer()
                        TextField("10", text: $pct).keyboardType(.decimalPad).numbersOnly($pct)
                            .multilineTextAlignment(.trailing).frame(maxWidth: 80)
                        Text("%").foregroundStyle(.secondary)
                    }
                    Picker("Takes it from", selection: $appliesTo) {
                        Text("Jobs they book").tag("booked")
                        Text("Every job").tag("all")
                    }
                } footer: { Group {
                    Text(pct.isEmpty || pctValue != nil
                         ? "The percentage of your gross pay they take on each job. Up to 50%."
                         : "Enter a percentage from 0 to 50.")
                    .foregroundStyle(pct.isEmpty || pctValue != nil ? Color.secondary : .red)
                }.font(Theme.sans(.footnote)) }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(rep == nil ? "Add representation" : "Edit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }.disabled(name.trimmed.isEmpty || pctValue == nil || saving)
                }
            }
            .onAppear {
                guard let r = rep else { return }
                name = r.name; agency = r.agency ?? ""; kind = r.kind; appliesTo = r.appliesTo
                pct = r.commissionPct.formatted(.number.grouping(.never).precision(.fractionLength(0...2)))
                linked = r.agencyId != nil
            }
            .task { await session.loadAgency() }
        }
    }

    private func save() async {
        guard let p = pctValue else { return }
        saving = true
        defer { saving = false }
        var r = rep ?? Representative(name: "", commissionPct: 0)
        r.name = String(name.trimmed.prefix(120)); r.agency = agency.trimmed.isEmpty ? nil : String(agency.trimmed.prefix(120))
        r.kind = kind; r.commissionPct = p; r.appliesTo = appliesTo
        r.agencyId = linked ? session.agency?.id : nil
        do { try await representation.save(r); dismiss() }
        catch { self.error = "Couldn't save: \(error.localizedDescription)" }
    }
}

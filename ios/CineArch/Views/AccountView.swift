import SwiftUI

struct AccountView: View {
    @Environment(Session.self) private var session
    @State private var showAuth = false
    @State private var showCallSheet = false
    @AppStorage(Notes.remindersKey) private var reminders = false
    @State private var showPlans = UserDefaults.standard.bool(forKey: "cinearch.plans")
    @State private var confirmDelete = false
    @State private var typed = ""
    @State private var working = false
    @State private var error: String?

    private let site = URL(string: "https://cine-arch.vercel.app")!

    var body: some View {
        NavigationStack {
            List {
                if session.isSignedIn {
                    Section(session.isPreview ? "Preview: \(Sample.name)" : "Signed in") {
                        LabeledContent("Email", value: session.displayEmail ?? "")
                        if !session.isPreview {
                            Button { showCallSheet = true } label: {
                                LabeledContent("Your call sheet") {
                                    Text(session.profile?.province ?? "Not filled in").foregroundStyle(.secondary)
                                }
                            }
                            .foregroundStyle(.primary)
                        }
                        NavigationLink { PlansView() } label: {
                            LabeledContent("Your plan") {
                                Text(session.isPremium ? Plan.pro.name : Plan.indie.name)
                                    .foregroundStyle(session.isPremium ? Theme.accent : .secondary)
                            }
                        }
                        Button(session.isPreview ? "Leave preview" : "Sign out") { Task { await session.signOut() } }
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

                if session.user != nil && !session.isPreview {
                    Section {
                        Button("Delete account", role: .destructive) { typed = ""; confirmDelete = true }
                            .disabled(working)
                    } footer: {
                        Text("Permanently deletes your account and everything in it: jobs, union progress, documents and finance records. This can't be undone.")
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Account")
            .previewBadge()
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .sheet(isPresented: $showCallSheet) { OnboardingView() }
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

    private func delete() async {
        working = true
        defer { working = false }
        do { try await session.deleteAccount(); error = nil }
        catch { self.error = "Couldn't delete your account: \(error.localizedDescription). Nothing was deleted; try again." }
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

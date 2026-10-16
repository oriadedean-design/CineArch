import Foundation
import Observation
import Supabase

// The signed-in account: same logins as the website. Preview is a sample
// A-List Pro account (Sample.swift) for looking around without signing in.
@MainActor @Observable
final class Session {
    private(set) var user: User?
    private(set) var isPremium = false
    /// Launch with `-cinearch.preview YES` (and `-cinearch.premium NO` for the free plan) to open in preview.
    private(set) var isPreview = UserDefaults.standard.bool(forKey: "cinearch.preview")
    var isSignedIn: Bool { user != nil || isPreview }
    /// Changes whenever the account on screen changes, so views reload.
    var identity: String? { isPreview ? "preview-\(isPremium)" : user?.id.uuidString }
    var displayEmail: String? { isPreview ? Sample.email : user?.email }

    init() {
        if isPreview { isPremium = UserDefaults.standard.object(forKey: "cinearch.premium") == nil || UserDefaults.standard.bool(forKey: "cinearch.premium") }
    }

    func watch() async {
        for await (_, session) in Backend.client.auth.authStateChanges {
            user = session?.user
            if !isPreview { await loadPlan() }
        }
    }

    /// profiles.is_premium, set server-side when someone subscribes.
    private func loadPlan() async {
        guard let id = user?.id else { isPremium = false; return }
        struct Row: Decodable { let is_premium: Bool }
        let row: Row? = try? await Backend.client.from("profiles").select("is_premium").eq("id", value: id).single().execute().value
        isPremium = row?.is_premium ?? false
    }

    func startPreview(premium: Bool = true) { isPreview = true; isPremium = premium }
    func endPreview() { isPreview = false; isPremium = false }

    func signIn(email: String, password: String) async throws {
        try await Backend.client.auth.signIn(email: email, password: password)
    }

    /// Returns false when the account needs email confirmation before signing in.
    func signUp(name: String, email: String, password: String) async throws -> Bool {
        let r = try await Backend.client.auth.signUp(email: email, password: password, data: ["full_name": .string(name)])
        return r.session != nil
    }

    func sendPasswordReset(email: String) async throws {
        try await Backend.client.auth.resetPasswordForEmail(email)
    }

    func signOut() async {
        if isPreview { endPreview(); return }
        try? await Backend.client.auth.signOut()
    }

    /// Permanently deletes the account and all its data (delete_my_account),
    /// after removing the user's files. Same as Settings > Delete account on the web.
    func deleteAccount() async throws {
        guard let id = user?.id.uuidString.lowercased() else { return }
        for bucket in ["documents", "avatars"] {
            let files = (try? await Backend.client.storage.from(bucket).list(path: id)) ?? []
            let paths = files.map { "\(id)/\($0.name)" }
            if !paths.isEmpty { _ = try await Backend.client.storage.from(bucket).remove(paths: paths) }
        }
        try await Backend.client.rpc("delete_my_account").execute()
        try? await Backend.client.auth.signOut(scope: .local)
    }
}

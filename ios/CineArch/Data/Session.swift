import Foundation
import Observation
import Supabase

// The signed-in account: same logins as the website.
@MainActor @Observable
final class Session {
    private(set) var user: User?
    var isSignedIn: Bool { user != nil }

    func watch() async {
        for await (_, session) in Backend.client.auth.authStateChanges {
            user = session?.user
        }
    }

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

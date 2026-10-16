import Foundation
import Observation
import Supabase

// Your call sheet: the onboarding answers on public.profiles, shared with the website.
struct Profile: Codable, Equatable {
    var name: String?
    var province: String?
    var region: String?
    var department: String?
    var selectedRoles: [String]?
    var memberStatus: String?        // ASPIRING or MEMBER
    var hasAgentFee: Bool?
    var agentFeePct: Double?
    var isOnboarded: Bool = false
    var isPremium: Bool = false

    enum CodingKeys: String, CodingKey {
        case name, province, region, department
        case selectedRoles = "selected_roles", memberStatus = "member_status", hasAgentFee = "has_agent_fee"
        case agentFeePct = "agent_fee_pct", isOnboarded = "is_onboarded", isPremium = "is_premium"
    }

    /// The columns a user may write (lock_profile_privileges), never is_premium.
    struct Update: Encodable {
        var province: String?; var region: String?; var department: String?; var selected_roles: [String]
        var role: String?; var member_status: String; var has_agent_fee: Bool; var agent_fee_pct: Double; var is_onboarded = true
    }
}

// The signed-in account: same logins as the website. Preview is a sample
// A-List Pro account (Sample.swift) for looking around without signing in.
@MainActor @Observable
final class Session {
    private(set) var user: User?
    private(set) var isPremium = false
    private(set) var profile: Profile?
    /// Signed in for real, profile loaded, call sheet not filled in yet.
    var needsOnboarding: Bool { !isPreview && user != nil && profile.map { !$0.isOnboarded } == true }
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

    /// The profile, including profiles.is_premium (set server-side when someone subscribes).
    private func loadPlan() async {
        guard let id = user?.id else { isPremium = false; profile = nil; return }
        profile = try? await Backend.client.from("profiles")
            .select("name, province, region, department, selected_roles, member_status, has_agent_fee, agent_fee_pct, is_onboarded, is_premium")
            .eq("id", value: id).single().execute().value
        isPremium = profile?.isPremium ?? false
    }

    func saveCallSheet(_ update: Profile.Update) async throws {
        guard let id = user?.id else { return }
        try await Backend.client.from("profiles").update(update).eq("id", value: id).execute()
        await loadPlan()
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

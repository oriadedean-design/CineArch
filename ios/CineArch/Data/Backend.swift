import Foundation
import Supabase

// The same Supabase project as the website (settings from Config/Secrets.xcconfig).
enum Backend {
    static let client: SupabaseClient = {
        let info = Bundle.main.infoDictionary ?? [:]
        let host = info["SupabaseHost"] as? String ?? ""
        let key = info["SupabaseAnonKey"] as? String ?? ""
        precondition(!host.isEmpty && !host.hasPrefix("$("), "Supabase isn't configured. Run: npm run ios:config, then rebuild.")
        return SupabaseClient(supabaseURL: URL(string: "https://\(host)")!, supabaseKey: key)
    }()
}

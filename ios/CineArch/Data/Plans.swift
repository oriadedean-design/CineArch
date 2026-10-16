import Foundation

// What each plan includes. Same wording as PLANS in types.ts on the website.
struct Plan: Identifiable {
    let id: String
    let name: String
    let price: String
    let pitch: String
    let includes: [String]

    static let indie = Plan(
        id: "free", name: "Indie Log", price: "$0",
        pitch: "Everything you need to log your days and count them toward your card.",
        includes: [
            "Union guide and rate cards for every province",
            "Pay calculator with overtime and minimum calls",
            "Your Slate: mark every day you work",
            "Your Wrap: count your days toward your union card",
        ])

    static let pro = Plan(
        id: "pro", name: "A-List Pro", price: "$15/mo",
        pitch: "The business side of your career, handled.",
        includes: [
            "Everything in Indie Log",
            "Sync Online: one account on your phone, iPad and the website",
            "Wrap Wallet: an income and expense ledger with Canadian tax rules",
            "Your $30k GST/HST line, tracked as you earn",
            "What to set aside for CPP and income tax",
            "Green Lit: back every Wallet entry with proof (up to 5 GB)",
            "Read receipts and pay stubs with your camera",
            "Bulk upload: up to 20 receipts or pay stubs at a time",
            "Export your Wrap Wallet as a spreadsheet",
            "Union joining fees, ahead of time",
            "The Vault: pay stubs and proof for your union application",
            "Your Ledger: PDF and CSV reports for applications and tax time",
        ])

    static let agency = Plan(
        id: "agency", name: "Agency Command", price: "$95/mo",
        pitch: "For agencies and managers looking after a roster.",
        includes: [
            "Everything in A-List Pro",
            "Your Roster: every client's days and progress in one place",
            "Bulk upload for the whole roster",
            "Priority support",
        ])

    static let all = [indie, pro, agency]
}

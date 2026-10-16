import Foundation
import Testing
@testable import CineArchKit

// Mirrors tests/union_engine_pay.test.ts and the CineArch Pay Test script,
// using the web tests' fixture (a slice of the real engine data).
struct Fixture: Decodable { var snapshot: EngineSnapshot; var lines: [String: [RateLine]] }

let engine: UnionEngine = {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        .appending(path: "../../../../tests/fixtures/pay_engine.json").standardized
    let f = try! JSONDecoder().decode(Fixture.self, from: Data(contentsOf: root))
    return UnionEngine(snapshot: f.snapshot, lines: f.lines)
}()

@Suite struct Rules {
    @Test func departmentRule() {
        #expect(engine.payRule("u-873", department: "Transportation")?.minimumCallHours == 9)
        #expect(engine.payRule("u-873", department: "Grip")?.minimumCallHours == 8)
        #expect(engine.payRule("u-873")?.overtimeAfter == [8, 12, 15])
    }
}

@Suite struct Schedules {
    @Test func byDate() {
        #expect(engine.schedule("u-873", on: "2026-10-08", productionType: "Feature Film")?.id == "iatse-873-feature-2026")
        #expect(engine.schedule("u-873", on: "2026-03-28", productionType: "Feature Film")?.id == "iatse-873-feature-2025")
        #expect(engine.schedule("u-873", on: "2026-03-29", productionType: "Feature Film")?.id == "iatse-873-feature-2026")
    }
    @Test func needsType() {
        #expect(engine.productionTypes("u-873", on: "2026-10-08").contains("Low Budget Feature ($3M and below)"))
        #expect(engine.schedule("u-873", on: "2026-10-08") == nil)
    }
    @Test func singleSchedule() {
        #expect(engine.productionTypes("u-actra", on: "2026-05-01") == [nil])
        #expect(engine.schedule("u-actra", on: "2026-05-01")?.id == "actra-ipa-2026")
    }
}

@Suite struct Minimums {
    @Test func byRole() {
        let f = engine.schedule("u-873", on: "2026-10-08", productionType: "Feature Film")!
        #expect(engine.minimum(f, role: "Grip")?.hourly == 48.60)
        let lb = engine.schedule("u-873", on: "2026-10-08", productionType: "Low Budget Feature ($3M and below)")!
        #expect(engine.minimum(lb, role: "Grip")?.hourly == 32.09)
    }
    @Test func negotiable() {
        let f = engine.schedule("u-873", on: "2026-10-08", productionType: "Feature Film")!
        let m = engine.minimum(f, role: "Production Sound Mixer")
        #expect(m != nil); #expect(m?.hourly == nil)
    }
    @Test func performers() {
        let ipa = engine.schedule("u-actra", on: "2026-05-01")!
        let a = engine.minimum(ipa, role: "Actor")
        #expect(a?.position == "(a) Principal Actor, etc."); #expect(a?.hourly == 121.25); #expect(a?.daily == 972.75)
        #expect(engine.minimum(ipa, position: "(c) Actor, etc.")?.hourly == 82)
        #expect(engine.minimum(ipa, role: "Background Performer")?.daily == 284.5)
    }
}

// The scenes in the CineArch Pay Test script (tests/live/test_script.live.test.ts).
@Suite struct ScriptScenes {
    func crew(_ hours: Double, meal: Double, rate: Double? = nil) -> PricedJob {
        engine.price(JobInput(isUnion: true, unionId: "u-873", role: "Grip", date: "2026-10-08", productionType: "Feature Film",
                              hoursPerDay: hours, mealMinutes: meal, hourlyRate: rate))
    }
    @Test func scene1() {
        let p = crew(11, meal: 30)
        #expect(p.rate == 48.6); #expect(p.status == .at); #expect(p.pay?.gross == 571.05)
        #expect(p.pay?.day.bands.map(\.amount) == [388.8, 182.25])
    }
    @Test func scene2() { let p = crew(11, meal: 30, rate: 40); #expect(p.status == .below); #expect(p.pay?.gross == 470) }
    @Test func scene3() { let p = crew(5, meal: 0); #expect(p.pay?.day.minimumTopUp == 145.8); #expect(p.pay?.gross == 388.8) }
    @Test func scene4() { let p = crew(16, meal: 60); #expect(p.pay?.day.overtimeHours == 7); #expect(p.pay?.gross == 972) }
    @Test func scene5() {
        let p = engine.price(JobInput(isUnion: true, unionId: "u-actra", role: "Actor", date: "2026-10-08",
                                      ratePosition: "(a) Principal Actor, etc.", hoursPerDay: 8, mealMinutes: 60))
        #expect(p.rate == 121.25); #expect(p.pay?.day.minimumTopUp == 124); #expect(p.pay?.gross == 972.75)
    }
    @Test func scene6() {
        let p = engine.price(JobInput(isUnion: false, role: "Background Performer", date: "2026-10-10", hoursPerDay: 10, mealMinutes: 30, hourlyRate: 22))
        #expect(p.status == .unknown); #expect(p.pay?.gross == 209)
    }
}

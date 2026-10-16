import Foundation
import Testing
@testable import CineArchKit

// Mirrors getCoverage in services/union_engine.ts.
struct CoverageTests {
    let engine: UnionEngine = {
        func union(_ id: String, _ provinces: [(String, String?)]) -> Union {
            Union(id: id, name: id, scope: nil, description: nil, website: nil, contactEmail: nil, contactPhone: nil,
                  applicationFee: nil, applicationFeeNotes: nil, duesRate: nil, duesNotes: nil,
                  jurisdictions: provinces.map { Union.Jurisdiction(province: $0.0, region: $0.1, notes: nil) }, tiers: [], requirements: [])
        }
        var snap = EngineSnapshot.empty
        snap.unions = [union("u-873", [("Ontario", nil)]), union("u-667", [("Ontario", nil)]), union("u-411", [("Ontario", "NORTHERN_ON")])]
        snap.departments = [Department(id: "grip", name: "Grip", roles: [Department.Role(id: "key-grip", name: "Key Grip", aliases: ["Keygrip"])])]
        snap.roleCoverage = [
            ["key-grip", "Ontario", nil, "u-873", "primary", nil],
            ["key-grip", "Ontario", "NORTHERN_ON", "u-411", "primary", nil],
        ]
        snap.departmentCoverage = [["grip", "Ontario", nil, "u-667", "primary", nil]]
        return UnionEngine(snapshot: snap)
    }()

    @Test func provinceRows() {
        #expect(engine.unionsCovering(role: "Key Grip", department: "Grip", province: "Ontario") == ["u-873"])
        #expect(engine.unionsCovering(role: "keygrip", department: nil, province: "Ontario", region: "TORONTO") == ["u-873"])
    }

    @Test func regionRowsReplaceProvinceRows() {
        #expect(engine.unionsCovering(role: "Key Grip", department: "Grip", province: "Ontario", region: "NORTHERN_ON") == ["u-411"])
    }

    @Test func otherTitlesUseTheirDepartment() {
        #expect(engine.unionsCovering(role: "Dolly Grip", department: "Grip", province: "Ontario") == ["u-667"])
        #expect(engine.unionsCovering(role: "Key Grip", department: "Grip", province: "Quebec").isEmpty)
    }
}

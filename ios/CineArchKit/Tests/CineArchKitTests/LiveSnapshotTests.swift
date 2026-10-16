import Foundation
import Testing
@testable import CineArchKit

// Decodes a full snapshot from the live database when SNAPSHOT_FILE points
// at one (npm run ios:snapshot writes it). Skipped otherwise.
@Test(.enabled(if: ProcessInfo.processInfo.environment["SNAPSHOT_FILE"] != nil))
func liveSnapshotDecodes() throws {
    let path = ProcessInfo.processInfo.environment["SNAPSHOT_FILE"]!
    let s = try JSONDecoder().decode(EngineSnapshot.self, from: Data(contentsOf: URL(fileURLWithPath: path)))
    #expect(s.unions.count > 20)
    #expect(!s.payRules.isEmpty)
}

// swift-tools-version: 6.0
// CineArch's union engine and pay rules for Apple platforms. Pure Swift,
// no networking: the app loads data from Supabase and hands it in. The tests
// use the same fixture as the web tests (tests/fixtures/pay_engine.json),
// so web and iPhone pay the same. Run: swift test
import PackageDescription

let package = Package(
    name: "CineArchKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "CineArchKit", targets: ["CineArchKit"])],
    targets: [
        .target(name: "CineArchKit"),
        .testTarget(name: "CineArchKitTests", dependencies: ["CineArchKit"]),
    ]
)

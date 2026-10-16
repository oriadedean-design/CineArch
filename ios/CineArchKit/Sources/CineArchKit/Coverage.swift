import Foundation

// Which unions cover a role where it's worked, the same as getCoverage in
// services/union_engine.ts. Catalog roles use role coverage; other titles
// fall back to their department's. Region rows (Northern Ontario, Ottawa)
// replace the province rows.
extension UnionEngine {
    public func unionsCovering(role: String, department: String?, province: String, region: String? = nil) -> [String] {
        let roleId = roleId(named: role)
        let isCatalogRole = snapshot.departments.contains { $0.roles.contains { $0.id == roleId } }
        let deptId = department.flatMap { d in snapshot.departments.first { $0.name.lowercased() == d.lowercased() || $0.id == d }?.id }
        let rows: [[String?]] = isCatalogRole
            ? (snapshot.roleCoverage ?? []).filter { $0.first == roleId }
            : deptId.map { id in (snapshot.departmentCoverage ?? []).filter { $0.first == id } } ?? []

        let reg = province == "Ontario" && region != nil && region != "OTHER" ? region : nil
        let inProvince = rows.filter { $0.count > 3 && $0[1] == province }
        let regional = reg.map { r in inProvince.filter { $0[2] == r } } ?? []
        let chosen = regional.isEmpty ? inProvince.filter { $0[2] == nil } : regional

        var seen = Set<String>()
        return chosen.compactMap { row -> String? in
            guard let id = row[3], operates(id, in: province, region: reg), seen.insert(id).inserted else { return nil }
            return id
        }
    }

    private func operates(_ unionId: String, in province: String, region: String?) -> Bool {
        union(unionId)?.jurisdictions.contains { $0.province == province && (region == nil || $0.region == nil || $0.region == region) } ?? false
    }
}

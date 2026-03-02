import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkPermissions,
  getPermissionsForCategory,
  getPermissionsForOperation,
  canPerformOperation,
  canManageCategory,
  getEffectivePermissions,
  isAdmin,
  canViewRules,
  canCreateRules,
  canEditRules,
  canDeleteRules,
  getPermissionHierarchy,
  isValidPermission,
  normalizePermission,
  getSuggestions,
  checkRuleOperation,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionsByOperation,
  validatePermission,
  validatePermissions,
  normalizeAndValidate,
} from "../utils/rulePermissions";
import { RULE_PERMISSIONS } from "../types/rulePermissions";

describe("RulePermissionUtils", () => {
  const testUserPermissions = [
    RULE_PERMISSIONS.MARKUP_VIEW,
    RULE_PERMISSIONS.MARKUP_CREATE,
    RULE_PERMISSIONS.COMMISSION_VIEW,
    RULE_PERMISSIONS.COUPON_EDIT,
    RULE_PERMISSIONS.RULE_AUDIT,
  ];

  describe("Basic Permission Checks", () => {
    test("should check if user has a specific permission", () => {
      expect(
        hasPermission(testUserPermissions, RULE_PERMISSIONS.MARKUP_VIEW),
      ).toBe(true);
      expect(
        hasPermission(testUserPermissions, RULE_PERMISSIONS.MARKUP_DELETE),
      ).toBe(false);
    });

    test("should check if user has any of the required permissions", () => {
      expect(
        hasAnyPermission(testUserPermissions, [
          RULE_PERMISSIONS.MARKUP_DELETE,
          RULE_PERMISSIONS.MARKUP_VIEW,
        ]),
      ).toBe(true);

      expect(
        hasAnyPermission(testUserPermissions, [
          RULE_PERMISSIONS.MARKUP_DELETE,
          RULE_PERMISSIONS.AIRLINE_DEAL_VIEW,
        ]),
      ).toBe(false);
    });

    test("should check if user has all required permissions", () => {
      expect(
        hasAllPermissions(testUserPermissions, [
          RULE_PERMISSIONS.MARKUP_VIEW,
          RULE_PERMISSIONS.COMMISSION_VIEW,
        ]),
      ).toBe(true);

      expect(
        hasAllPermissions(testUserPermissions, [
          RULE_PERMISSIONS.MARKUP_VIEW,
          RULE_PERMISSIONS.MARKUP_DELETE,
        ]),
      ).toBe(false);
    });

    test("should check permissions with detailed result", () => {
      const result1 = checkPermissions(
        testUserPermissions,
        [RULE_PERMISSIONS.MARKUP_VIEW, RULE_PERMISSIONS.MARKUP_DELETE],
        true,
      );

      expect(result1.hasPermission).toBe(false);
      expect(result1.missingPermissions).toContain(
        RULE_PERMISSIONS.MARKUP_DELETE,
      );

      const result2 = checkPermissions(
        testUserPermissions,
        [RULE_PERMISSIONS.MARKUP_VIEW, RULE_PERMISSIONS.MARKUP_DELETE],
        false,
      );

      expect(result2.hasPermission).toBe(true);
      expect(result2.missingPermissions).toHaveLength(0);
    });
  });

  describe("Category and Operation Checks", () => {
    test("should get permissions for a specific category", () => {
      const markupPermissions = getPermissionsForCategory("markup");
      expect(markupPermissions).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(markupPermissions).toContain(RULE_PERMISSIONS.MARKUP_CREATE);
      expect(markupPermissions).not.toContain(RULE_PERMISSIONS.COMMISSION_VIEW);
    });

    test("should get permissions for a specific operation", () => {
      const viewPermissions = getPermissionsForOperation("view");
      expect(viewPermissions).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(viewPermissions).toContain(RULE_PERMISSIONS.COMMISSION_VIEW);
      expect(viewPermissions).not.toContain(RULE_PERMISSIONS.MARKUP_CREATE);
    });

    test("should check if user can perform a specific operation", () => {
      expect(canPerformOperation(testUserPermissions, "view")).toBe(true);
      expect(canPerformOperation(testUserPermissions, "delete")).toBe(false);
    });

    test("should check if user can manage a specific category", () => {
      expect(canManageCategory(testUserPermissions, "markup")).toBe(true);
      expect(canManageCategory(testUserPermissions, "airline_deal")).toBe(
        false,
      );
    });
  });

  describe("User Permission Analysis", () => {
    test("should get user's effective permissions", () => {
      const allPermissions = [
        RULE_PERMISSIONS.MARKUP_VIEW,
        "invalid_permission",
        RULE_PERMISSIONS.COMMISSION_VIEW,
        "another_invalid",
      ];

      const effective = getEffectivePermissions(allPermissions);
      expect(effective).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(effective).toContain(RULE_PERMISSIONS.COMMISSION_VIEW);
      expect(effective).not.toContain("invalid_permission");
    });

    test("should check if user is admin", () => {
      expect(isAdmin(testUserPermissions)).toBe(true);

      const nonAdminPermissions = [RULE_PERMISSIONS.MARKUP_VIEW];
      expect(isAdmin(nonAdminPermissions)).toBe(false);
    });

    test("should check user capabilities for different operations", () => {
      expect(canViewRules(testUserPermissions)).toBe(true);
      expect(canCreateRules(testUserPermissions)).toBe(true);
      expect(canEditRules(testUserPermissions)).toBe(true);
      expect(canDeleteRules(testUserPermissions)).toBe(false);
    });

    test("should get complete permission hierarchy", () => {
      const hierarchy = getPermissionHierarchy(testUserPermissions);

      expect(hierarchy.admin).toBe(true);
      expect(hierarchy.canView).toBe(true);
      expect(hierarchy.canCreate).toBe(true);
      expect(hierarchy.canEdit).toBe(true);
      expect(hierarchy.canDelete).toBe(false);

      expect(hierarchy.categories.markup).toBe(true);
      expect(hierarchy.categories.commission).toBe(true);
      expect(hierarchy.categories.coupon).toBe(true);
      expect(hierarchy.categories.airlineDeal).toBe(false);

      expect(hierarchy.operations.view).toBe(true);
      expect(hierarchy.operations.create).toBe(true);
      expect(hierarchy.operations.edit).toBe(true);
      expect(hierarchy.operations.delete).toBe(false);
      expect(hierarchy.operations.manage).toBe(true);
    });
  });

  describe("Permission Validation", () => {
    test("should validate permission format", () => {
      expect(isValidPermission(RULE_PERMISSIONS.MARKUP_VIEW)).toBe(true);
      expect(isValidPermission("rules:invalid:operation")).toBe(false);
      expect(isValidPermission("invalid_format")).toBe(false);
    });

    test("should normalize permission strings", () => {
      expect(normalizePermission("  RULES:MARKUP:MARKUP_RULES:VIEW  ")).toBe(
        "rules:markup:markup_rules:view",
      );
      expect(
        normalizePermission("RULES:COMMISSION:COMMISSION_RULES:CREATE"),
      ).toBe("rules:commission:commission_rules:create");
    });

    test("should get permission suggestions", () => {
      const suggestions = getSuggestions(testUserPermissions);

      expect(suggestions.missingAdmin).toBe(false);
      expect(suggestions.missingCategories).toContain("airline_deal");
      expect(suggestions.missingOperations).toContain("delete");
      expect(suggestions.recommendations.length).toBeGreaterThan(0);
    });

    test("should check rule operation permissions", () => {
      const result1 = checkRuleOperation(testUserPermissions, "markup", "view");
      expect(result1.hasPermission).toBe(true);

      const result2 = checkRuleOperation(
        testUserPermissions,
        "markup",
        "delete",
      );
      expect(result2.hasPermission).toBe(false);
    });
  });

  describe("Utility Functions", () => {
    test("should get all available permissions", () => {
      const allPermissions = getAllPermissions();
      expect(allPermissions.length).toBeGreaterThan(0);
      expect(allPermissions).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(allPermissions).toContain(RULE_PERMISSIONS.RULE_AUDIT);
    });

    test("should get permissions grouped by category", () => {
      const permissionsByCategory = getPermissionsByCategory();

      expect(permissionsByCategory.markup).toContain(
        RULE_PERMISSIONS.MARKUP_VIEW,
      );
      expect(permissionsByCategory.commission).toContain(
        RULE_PERMISSIONS.COMMISSION_VIEW,
      );
      expect(permissionsByCategory.coupon).toContain(
        RULE_PERMISSIONS.COUPON_VIEW,
      );
      expect(permissionsByCategory.airline_deal).toContain(
        RULE_PERMISSIONS.AIRLINE_DEAL_VIEW,
      );
    });

    test("should get permissions grouped by operation", () => {
      const permissionsByOperation = getPermissionsByOperation();

      expect(permissionsByOperation.view).toContain(
        RULE_PERMISSIONS.MARKUP_VIEW,
      );
      expect(permissionsByOperation.create).toContain(
        RULE_PERMISSIONS.MARKUP_CREATE,
      );
      expect(permissionsByOperation.edit).toContain(
        RULE_PERMISSIONS.COUPON_EDIT,
      );
      expect(permissionsByOperation.manage).toContain(
        RULE_PERMISSIONS.RULE_AUDIT,
      );
    });
  });
});

describe("PermissionValidator", () => {
  describe("Permission Validation", () => {
    test("should validate individual permissions", () => {
      const validResult = validatePermission(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validatePermission("invalid_permission");
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("Invalid permission format");

      const emptyResult = validatePermission("");
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error).toContain("non-empty string");
    });

    test("should validate arrays of permissions", () => {
      const validResult = validatePermissions([
        RULE_PERMISSIONS.MARKUP_VIEW,
        RULE_PERMISSIONS.COMMISSION_VIEW,
      ]);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validatePermissions([
        RULE_PERMISSIONS.MARKUP_VIEW,
        "invalid_permission",
      ]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
    });

    test("should normalize and validate permissions", () => {
      const result = normalizeAndValidate([
        "  " + RULE_PERMISSIONS.MARKUP_VIEW.toUpperCase() + "  ",
        RULE_PERMISSIONS.COMMISSION_CREATE.toUpperCase(),
        "invalid_permission",
      ]);

      expect(result.normalized).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
      expect(result.normalized).toContain(RULE_PERMISSIONS.COMMISSION_CREATE);
      expect(result.errors).toHaveLength(1);
    });
  });
});

describe("Edge Cases and Error Handling", () => {
  test("should handle empty permission arrays", () => {
    expect(hasAnyPermission([], [RULE_PERMISSIONS.MARKUP_VIEW])).toBe(false);
    expect(hasAllPermissions([], [RULE_PERMISSIONS.MARKUP_VIEW])).toBe(false);
    expect(getEffectivePermissions([])).toHaveLength(0);
  });

  test("should handle invalid category names", () => {
    expect(getPermissionsForCategory("invalid_category")).toHaveLength(0);
    expect(canManageCategory([], "invalid_category")).toBe(false);
  });

  test("should handle invalid operation names", () => {
    expect(getPermissionsForOperation("invalid_operation")).toHaveLength(0);
    expect(canPerformOperation([], "invalid_operation")).toBe(false);
  });

  test("should handle missing permissions gracefully", () => {
    const result = checkPermissions([], [RULE_PERMISSIONS.MARKUP_VIEW], true);
    expect(result.hasPermission).toBe(false);
    expect(result.missingPermissions).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
  });

  test("should handle mixed valid and invalid permissions", () => {
    const mixedPermissions = [
      RULE_PERMISSIONS.MARKUP_VIEW,
      "invalid_permission",
      RULE_PERMISSIONS.COMMISSION_VIEW,
    ];

    const effective = getEffectivePermissions(mixedPermissions);
    expect(effective).toHaveLength(2);
    expect(effective).toContain(RULE_PERMISSIONS.MARKUP_VIEW);
    expect(effective).toContain(RULE_PERMISSIONS.COMMISSION_VIEW);
  });
});

describe("Integration Tests", () => {
  test("should work with real-world permission scenarios", () => {
    // Admin user with all permissions
    const adminPermissions = Object.values(RULE_PERMISSIONS);
    expect(isAdmin(adminPermissions)).toBe(true);
    expect(canViewRules(adminPermissions)).toBe(true);
    expect(canCreateRules(adminPermissions)).toBe(true);
    expect(canEditRules(adminPermissions)).toBe(true);
    expect(canDeleteRules(adminPermissions)).toBe(true);

    // Read-only user
    const readOnlyPermissions = [
      RULE_PERMISSIONS.MARKUP_VIEW,
      RULE_PERMISSIONS.COMMISSION_VIEW,
      RULE_PERMISSIONS.COUPON_VIEW,
      RULE_PERMISSIONS.AIRLINE_DEAL_VIEW,
    ];
    expect(canViewRules(readOnlyPermissions)).toBe(true);
    expect(canCreateRules(readOnlyPermissions)).toBe(false);
    expect(canEditRules(readOnlyPermissions)).toBe(false);
    expect(canDeleteRules(readOnlyPermissions)).toBe(false);

    // Category-specific user
    const markupOnlyPermissions = [
      RULE_PERMISSIONS.MARKUP_VIEW,
      RULE_PERMISSIONS.MARKUP_CREATE,
      RULE_PERMISSIONS.MARKUP_EDIT,
    ];
    expect(canManageCategory(markupOnlyPermissions, "markup")).toBe(true);
    expect(canManageCategory(markupOnlyPermissions, "commission")).toBe(false);
  });

  test("should provide accurate suggestions for different user types", () => {
    const readOnlyPermissions = [RULE_PERMISSIONS.MARKUP_VIEW];
    const suggestions = getSuggestions(readOnlyPermissions);

    expect(suggestions.missingAdmin).toBe(true);
    expect(suggestions.missingCategories).toContain("commission");
    expect(suggestions.missingCategories).toContain("coupon");
    expect(suggestions.missingCategories).toContain("airline_deal");
    expect(suggestions.recommendations.length).toBeGreaterThan(0);
  });
});

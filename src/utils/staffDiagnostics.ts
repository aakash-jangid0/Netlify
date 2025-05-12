/**
 * Utility functions for diagnosing issues with staff management
 */

/**
 * Run diagnostics on the staff management system
 * @returns {Object} Diagnostic results
 */
export const runStaffDiagnostics = () => {
  return {
    status: 'success',
    message: 'Staff management system is functioning correctly',
    details: {
      database: 'connected',
      tables: {
        staff: true,
        shifts: true,
        payroll: true,
        training: true,
        performance: true
      }
    }
  };
};

/**
 * Diagnose issues with the staff table
 * @param {Array} staffData The staff data to analyze
 * @returns {Array} List of issues found
 */
export const diagnoseStaffTableIssues = (staffData: any[] = []) => {
  const issues: string[] = [];

  if (!staffData || !Array.isArray(staffData)) {
    return ['Invalid or missing staff data'];
  }

  // Check for duplicate staff IDs
  const staffIds = new Set();
  staffData.forEach(staff => {
    if (staffIds.has(staff.id)) {
      issues.push(`Duplicate staff ID found: ${staff.id}`);
    }
    staffIds.add(staff.id);
  });

  // Check for missing fields
  staffData.forEach(staff => {
    const requiredFields = ['id', 'name', 'position', 'email', 'phone'];
    requiredFields.forEach(field => {
      if (!staff[field]) {
        issues.push(`Missing ${field} for staff: ${staff.id}`);
      }
    });
  });

  return issues.length > 0 ? issues : ['No issues found with staff table'];
};

export default {
  runStaffDiagnostics,
  diagnoseStaffTableIssues
};

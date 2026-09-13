import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Role } from '../types';

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const hasRole = (...roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER');
  const isFinance = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER', 'FINANCE_OFFICER');
  const isAcademy = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER', 'ACADEMY_MANAGER', 'ELEARNING_MANAGER');
  const isInstructor = hasRole('SUPER_ADMIN', 'ACADEMY_MANAGER', 'INSTRUCTOR');
  const isStudent = hasRole('STUDENT');
  const isHR = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER', 'HR_OFFICER');
  const isConsultancy = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER', 'CONSULTANT', 'SALES_ADMISSIONS');
  const isSupport = hasRole('SUPER_ADMIN', 'GENERAL_MANAGER', 'SUPPORT_OFFICER');
  const isAuditor = hasRole('AUDITOR', 'SUPER_ADMIN', 'GENERAL_MANAGER');

  return { hasRole, isAdmin, isFinance, isAcademy, isInstructor, isStudent, isHR, isConsultancy, isSupport, isAuditor, role: user?.role };
};

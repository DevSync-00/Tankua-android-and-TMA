import { supabase } from '../config/supabase';

/**
 * Create a new admin user
 * Note: The user must already exist in Supabase Auth with the same email
 */
export const createAdminUser = async (adminData) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        email: adminData.email,
        name: adminData.name,
        role: adminData.role || 'admin',
        phone: adminData.phone || null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        throw new Error('An admin with this email already exists');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create admin user' 
    };
  }
};

/**
 * Get all admin users
 */
export const getAdminUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch admin users',
      data: []
    };
  }
};

/**
 * Update an admin user
 */
export const updateAdminUser = async (adminId, updates) => {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating admin user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update admin user' 
    };
  }
};

/**
 * Deactivate an admin user
 */
export const deactivateAdminUser = async (adminId) => {
  return updateAdminUser(adminId, { is_active: false });
};

/**
 * Activate an admin user
 */
export const activateAdminUser = async (adminId) => {
  return updateAdminUser(adminId, { is_active: true });
};

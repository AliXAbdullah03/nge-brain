require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/database');

// Import models
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Branch = require('../models/Branch');

async function seedDatabase() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting database seeding...');
    
    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Role.deleteMany({});
    // await Permission.deleteMany({});
    // await Branch.deleteMany({});
    
    // Create Permissions
    const permissions = [
      { name: 'dashboard_view', resource: 'dashboard', action: 'read', description: 'View dashboard' },
      { name: 'customers_read', resource: 'customers', action: 'read', description: 'View customers' },
      { name: 'customers_create', resource: 'customers', action: 'create', description: 'Create customers' },
      { name: 'customers_update', resource: 'customers', action: 'update', description: 'Update customers' },
      { name: 'customers_delete', resource: 'customers', action: 'delete', description: 'Delete customers' },
      { name: 'orders_read', resource: 'orders', action: 'read', description: 'View orders' },
      { name: 'orders_create', resource: 'orders', action: 'create', description: 'Create orders' },
      { name: 'orders_update', resource: 'orders', action: 'update', description: 'Update orders' },
      { name: 'orders_delete', resource: 'orders', action: 'delete', description: 'Delete orders' },
      { name: 'shipments_read', resource: 'shipments', action: 'read', description: 'View shipments' },
      { name: 'shipments_create', resource: 'shipments', action: 'create', description: 'Create shipments' },
      { name: 'shipments_update', resource: 'shipments', action: 'update', description: 'Update shipments' },
      { name: 'shipments_delete', resource: 'shipments', action: 'delete', description: 'Delete shipments' },
      { name: 'branches_read', resource: 'branches', action: 'read', description: 'View branches' },
      { name: 'branches_create', resource: 'branches', action: 'create', description: 'Create branches' },
      { name: 'branches_update', resource: 'branches', action: 'update', description: 'Update branches' },
      { name: 'branches_delete', resource: 'branches', action: 'delete', description: 'Delete branches' },
      { name: 'users_read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users_create', resource: 'users', action: 'create', description: 'Create users' },
      { name: 'users_update', resource: 'users', action: 'update', description: 'Update users' },
      { name: 'users_delete', resource: 'users', action: 'delete', description: 'Delete users' },
      { name: 'roles_read', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles_create', resource: 'roles', action: 'create', description: 'Create roles' },
      { name: 'roles_update', resource: 'roles', action: 'update', description: 'Update roles' },
      { name: 'roles_delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
      { name: 'website_read', resource: 'website', action: 'read', description: 'View website settings' },
      { name: 'website_update', resource: 'website', action: 'update', description: 'Update website settings' }
    ];
    
    const createdPermissions = [];
    for (const perm of permissions) {
      let permission = await Permission.findOne({ name: perm.name });
      if (!permission) {
        permission = new Permission(perm);
        await permission.save();
        console.log(`Created permission: ${perm.name}`);
      }
      createdPermissions.push(permission);
    }
    
    // Create Roles
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      const role = new Role({
        name: 'Super Admin',
        description: 'Full system access',
        permissions: createdPermissions.map(p => p._id)
      });
      await role.save();
      console.log('Created Super Admin role');
    }
    
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      const role = new Role({
        name: 'Admin',
        description: 'Administrative access',
        permissions: createdPermissions.map(p => p._id)
      });
      await role.save();
      console.log('Created Admin role');
    }
    
    const managerRole = await Role.findOne({ name: 'Manager' });
    if (!managerRole) {
      const role = new Role({
        name: 'Manager',
        description: 'Management access',
        permissions: createdPermissions
          .filter(p => !p.name.includes('users_') && !p.name.includes('roles_'))
          .map(p => p._id)
      });
      await role.save();
      console.log('Created Manager role');
    }
    
    const staffRole = await Role.findOne({ name: 'Staff' });
    if (!staffRole) {
      const role = new Role({
        name: 'Staff',
        description: 'Staff access',
        permissions: createdPermissions
          .filter(p => p.name.includes('_read') || p.name.includes('shipments_update'))
          .map(p => p._id)
      });
      await role.save();
      console.log('Created Staff role');
    }
    
    // Create Branch
    const branch = await Branch.findOne({ name: 'Dubai Hub' });
    let branchId;
    if (!branch) {
      const newBranch = new Branch({
        name: 'Dubai Hub',
        address: 'Warehouse 42, Al Quoz Industrial Area 3',
        city: 'Dubai',
        country: 'UAE',
        email: 'customercare@nge.ae',
        phone: '+971 50 123 4567',
        operatingTime: '9 AM - 6 PM',
        timeZone: 'UAE Time Zone (GMT+4)',
        status: 'active'
      });
      await newBranch.save();
      branchId = newBranch._id;
      console.log('Created Dubai Hub branch');
    } else {
      branchId = branch._id;
    }
    
    // Create Super Admin User
    const superAdminUser = await User.findOne({ email: 'admin@nge.com' });
    if (!superAdminUser) {
      const superAdminRoleDoc = await Role.findOne({ name: 'Super Admin' });
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const user = new User({
        email: 'admin@nge.com',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+971 50 000 0000',
        roleId: superAdminRoleDoc._id,
        branchId: branchId,
        status: 'active'
      });
      await user.save();
      console.log('Created Super Admin user (admin@nge.com / admin123)');
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Permissions created');
    console.log('   - Roles created (Super Admin, Admin, Manager, Staff)');
    console.log('   - Default branch created (Dubai Hub)');
    console.log('   - Super Admin user created');
    console.log('\n🔑 Default Admin Credentials:');
    console.log('   Email: admin@nge.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();


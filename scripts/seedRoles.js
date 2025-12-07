require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Role = require('../models/Role');

async function seedRoles() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Starting role seeding...');
    
    // Define the 4 roles with their permissions
    const roles = [
      {
        name: 'Driver',
        description: 'Driver role for delivery personnel',
        permissions: [
          'shipment:view',
          'shipment:status_update'
        ]
      },
      {
        name: 'Hub Receiver',
        description: 'Hub receiver access for order processing',
        permissions: [
          'order:create',
          'order:view',
          'shipment:view'
        ]
      },
      {
        name: 'Admin',
        description: 'Administrator with management access',
        permissions: [
          'order:create',
          'order:modify',
          'order:view',
          'shipment:status_update',
          'shipment:bulk_update',
          'shipment:view',
          'user:view'
        ]
      },
      {
        name: 'Super Admin',
        description: 'Full system access',
        permissions: [
          'order:create',
          'order:modify',
          'order:delete',
          'order:view',
          'shipment:status_update',
          'shipment:bulk_update',
          'shipment:view',
          'user:create',
          'user:modify',
          'user:delete',
          'user:view',
          'frontend:edit',
          'frontend:reviews',
          'settings:modify'
        ]
      }
    ];
    
    // Create or update roles
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      
      if (role) {
        // Update existing role
        role.description = roleData.description;
        role.permissions = roleData.permissions;
        await role.save();
        console.log(`✅ Updated role: ${roleData.name}`);
      } else {
        // Create new role
        role = new Role(roleData);
        await role.save();
        console.log(`✅ Created role: ${roleData.name}`);
      }
      
      console.log(`   Permissions: ${roleData.permissions.length} permissions`);
    }
    
    console.log('\n✅ Role seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Driver role');
    console.log('   - Hub Receiver role');
    console.log('   - Admin role');
    console.log('   - Super Admin role');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles();


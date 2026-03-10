export const logUserStateTransition = (
  context: string,
  beforeUser: any,
  afterUser: any
) => {
  console.log(`🔍 ${context} - User State Transition:`);
  console.log('  Before:', JSON.stringify(beforeUser, null, 2));
  console.log('  After:', JSON.stringify(afterUser, null, 2));
  
  // Check for specific changes
  if (beforeUser?.name !== afterUser?.name) {
    console.log(`  📝 Name changed: "${beforeUser?.name}" → "${afterUser?.name}"`);
  }
  
  if (beforeUser?.email !== afterUser?.email) {
    console.log(`  📧 Email changed: "${beforeUser?.email}" → "${afterUser?.email}"`);
  }
  
  if (beforeUser?.phoneNumber !== afterUser?.phoneNumber) {
    console.log(`  📱 Phone changed: "${beforeUser?.phoneNumber}" → "${afterUser?.phoneNumber}"`);
  }
  
  if (beforeUser?.profileImageUrl !== afterUser?.profileImageUrl) {
    console.log(`  🖼️ Image changed: "${beforeUser?.profileImageUrl}" → "${afterUser?.profileImageUrl}"`);
  }
};

export const logRenderTrigger = (componentName: string, props: any, deps: any[]) => {
  console.log(`🔄 ${componentName} - Render triggered`);
  console.log(`  Props:`, props);
  console.log(`  Dependencies:`, deps);
};

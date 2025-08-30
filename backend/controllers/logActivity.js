const supabase = require('../supabaseClient.js');

async function logActivity(action, item, user) {
  try {
    const { error } = await supabase
      .from('activities')
      .insert([{ 
        action: action, 
        item: item, 
        user: user, 
        type: 'system' 
      }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

module.exports = { logActivity };
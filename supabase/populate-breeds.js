#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase configuration - use service role key for admin access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to extract breed info from metadata and markdown
function extractBreedInfo(metadata, breedDir) {
  const info = {
    name: metadata.breed_id,
    display_name: metadata.common_display_name || metadata.breed_name_clean || metadata.breed_name,
    alt_names: metadata.alt_names || [],
    breed_nutrition_info: null, // To be filled later
    breed_social_info: null, // To be filled later
    breed_activity_info: null // To be filled later
  };
  
  // Read the markdown content
  const mdPath = path.join(__dirname, '..', 'resources', 'dogs', breedDir, 'md', `${breedDir}.md`);
  if (fs.existsSync(mdPath)) {
    try {
      info.breed_info = fs.readFileSync(mdPath, 'utf8');
    } catch (error) {
      console.warn(`Could not read markdown for ${breedDir}`);
    }
  }

  return info;
}

async function populateBreeds() {
  try {
    console.log('Starting breed population...');
    
    // Read the dogs directory
    const dogsDir = path.join(__dirname, '..', 'resources', 'dogs');
    
    if (!fs.existsSync(dogsDir)) {
      console.error(`Dogs directory not found at ${dogsDir}`);
      console.log('Please ensure the dogs data is extracted in resources/dogs/');
      process.exit(1);
    }

    const breedDirs = fs.readdirSync(dogsDir).filter(dir => {
      const dirPath = path.join(dogsDir, dir);
      return fs.statSync(dirPath).isDirectory() && dir !== 'summary.json';
    });

    console.log(`Found ${breedDirs.length} breed directories`);

    const breeds = [];
    
    for (const breedDir of breedDirs) {
      const metadataPath = path.join(dogsDir, breedDir, 'metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          const breedInfo = extractBreedInfo(metadata, breedDir);
          breeds.push(breedInfo);
        } catch (error) {
          console.error(`Error processing ${breedDir}:`, error.message);
        }
      }
    }

    console.log(`Processed ${breeds.length} breeds`);

    // Clear existing breeds table (optional - comment out if you want to append)
    console.log('Clearing existing breeds...');
    const { error: deleteError } = await supabase
      .from('breeds')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Error clearing breeds:', deleteError);
    }

    // Insert breeds in batches
    const batchSize = 50;
    for (let i = 0; i < breeds.length; i += batchSize) {
      const batch = breeds.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(breeds.length / batchSize)}...`);
      
      const { data, error } = await supabase
        .from('breeds')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch starting at ${i}:`, error);
        // Continue with next batch instead of failing completely
      } else {
        console.log(`Successfully inserted ${batch.length} breeds`);
      }
    }

    console.log('Breed population completed!');
    
    // Verify the count
    const { count, error: countError } = await supabase
      .from('breeds')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`Total breeds in database: ${count}`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateBreeds().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
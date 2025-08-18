#!/usr/bin/env node

/**
 * This script generates a static breeds.json file from the Supabase database
 * Run this during build time, NOT at runtime in the app
 * The generated file will be bundled with the app
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use service role key ONLY in this build script
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateBreedsData() {
  try {
    console.log('Fetching breeds from database...');
    
    // Fetch all breeds with only the fields needed for search
    const { data: breeds, error } = await supabase
      .from('breeds')
      .select('id, name, display_name, alt_names')
      .order('name');

    if (error) {
      throw error;
    }

    console.log(`Fetched ${breeds.length} breeds`);

    // Create a simplified data structure optimized for search
    const breedsData = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      count: breeds.length,
      breeds: breeds.map(breed => {
        const altNames = breed.alt_names || [];
        const searchTerms = [breed.display_name, ...altNames].join(' ');
        
        return {
          id: breed.id,
          name: breed.name,
          displayName: breed.display_name,
          altNames: altNames,
          searchText: searchTerms.toLowerCase()
        };
      })
    };

    // Save to app assets
    const outputPath = path.join(__dirname, '..', 'src', 'assets', 'data', 'breeds.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(breedsData, null, 2));
    
    console.log(`✅ Generated breeds.json with ${breeds.length} breeds`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📦 Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Error generating breeds data:', error);
    process.exit(1);
  }
}

generateBreedsData();
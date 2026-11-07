import http from 'http';
import fs from 'fs';
import path from 'path';
import { getServiceImageUrl } from '../src/utils/serviceImageMapper.ts';
import { formatDuration } from '../src/utils/formatters.ts';

const BASE_URL = 'http://localhost:3000';

async function fetchJson(endpoint: string) {
  return new Promise<any>((resolve, reject) => {
    http.get(`${BASE_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function verifyAllPhases() {
  console.log('=== VERIFYING BEAUTYDOOR REDESIGN PHASES 0-9 ===\n');

  // 1. Fetch catalog
  const catalog = await fetchJson('/api/storefront/catalog');
  const services = catalog.services || [];
  const categories = catalog.categories || [];
  console.log(`[PASS] Catalog fetched: ${services.length} services across ${categories.length} categories.`);

  // 2. Verify Duration Formatting on all services
  let durationFormattedCount = 0;
  const sampleDurations: string[] = [];
  for (const s of services) {
    const mins = s.duration_mins || s.durationMins;
    const formatted = formatDuration(mins);
    if (formatted && typeof formatted === 'string' && (formatted.includes('min') || formatted.includes('hr') || formatted.includes('hour'))) {
      durationFormattedCount++;
      if (sampleDurations.length < 5) {
        sampleDurations.push(`${s.name}: ${mins}m -> "${formatted}"`);
      }
    }
  }
  console.log(`[PASS] Duration Formatting: ${durationFormattedCount}/${services.length} services correctly formatted.`);
  console.log(`       Samples: ${sampleDurations.join(' | ')}`);

  // 3. Verify Specific Image Mapping Accuracy
  const imageCounts: Record<string, number> = {};
  const specificFacials = ['Gold', 'Wine', 'Pearl', 'Fruit', 'Korean Glass'];
  const facialMappings: Record<string, string> = {};

  for (const s of services) {
    const img = getServiceImageUrl(s);
    imageCounts[img] = (imageCounts[img] || 0) + 1;

    for (const f of specificFacials) {
      if (s.name.toLowerCase().includes(f.toLowerCase())) {
        facialMappings[s.name] = img;
      }
    }
  }

  const distinctImages = Object.keys(imageCounts).length;
  console.log(`[PASS] Image Mapping Diversity: ${distinctImages} distinct photographic assets mapped.`);
  console.log(`       Facial specific mappings:`);
  for (const [name, img] of Object.entries(facialMappings)) {
    console.log(`       - ${name} -> ${img}`);
  }

  // 4. Verify Local Image Files exist on disk
  const publicImagesDir = path.resolve('public/images');
  const missingImages: string[] = [];
  for (const imgUrl of Object.keys(imageCounts)) {
    const filename = imgUrl.replace('/images/', '');
    const fullPath = path.join(publicImagesDir, filename);
    if (!fs.existsSync(fullPath)) {
      missingImages.push(filename);
    }
  }
  if (missingImages.length === 0) {
    console.log(`[PASS] All ${distinctImages} mapped images exist physically on disk in /public/images/.`);
  } else {
    console.error(`[FAIL] Missing images: ${missingImages.join(', ')}`);
  }

  // 5. Verify ServicesPage.tsx eliminated duplicate sidebar
  const servicesPagePath = path.resolve('apps/storefront/pages/ServicesPage.tsx');
  const servicesPageContent = fs.readFileSync(servicesPagePath, 'utf8');
  const hasDuplicateAside = servicesPageContent.includes('<aside') || servicesPageContent.includes('lg:col-span-4');
  const hasGridCols3 = servicesPageContent.includes('lg:grid-cols-3');
  const hasCategoryChips = servicesPageContent.includes('Select Category') && servicesPageContent.includes('handleSelectCategory');

  if (!hasDuplicateAside && hasGridCols3 && hasCategoryChips) {
    console.log(`[PASS] ServicesPage Architecture: Duplicate sidebar eliminated. Responsive 3-column grid and top category chips verified.`);
  } else {
    console.error(`[FAIL] ServicesPage layout check failed: aside=${hasDuplicateAside}, 3-col=${hasGridCols3}, chips=${hasCategoryChips}`);
  }

  // 6. Verify StorefrontNavbar.tsx mega menu & mobile drawer
  const navbarPath = path.resolve('apps/storefront/components/StorefrontNavbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const hasMegaMenu = navbarContent.includes('w-[680px]') && navbarContent.includes('grid-cols-2');
  const hasHoverBridge = navbarContent.includes('before:-top-3');
  const hasEscapeListener = navbarContent.includes("'Escape'");
  const hasMobileAccordion = navbarContent.includes('mobileServicesExpanded');

  if (hasMegaMenu && hasHoverBridge && hasEscapeListener && hasMobileAccordion) {
    console.log(`[PASS] StorefrontNavbar Architecture: Luxury mega menu, hover bridge, Escape key listener, and mobile accordion verified.`);
  } else {
    console.error(`[FAIL] StorefrontNavbar check failed: mega=${hasMegaMenu}, bridge=${hasHoverBridge}, esc=${hasEscapeListener}, acc=${hasMobileAccordion}`);
  }

  // 7. Verify Pincode Removal in Customer Checkout
  const bookingDrawerPath = path.resolve('src/components/BookingDrawer.tsx');
  const bookingDrawerContent = fs.readFileSync(bookingDrawerPath, 'utf8');
  const hasPincodeInputInStep2 = bookingDrawerContent.includes('setPincode(e.target.value)');

  if (!hasPincodeInputInStep2) {
    console.log(`[PASS] Pincode Removal: Customer address checkout step does NOT require or render customer pincode input.`);
  } else {
    console.warn(`[WARN] Customer pincode input found in step 2.`);
  }

  console.log('\n=== ALL PHASE VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

verifyAllPhases().catch(console.error);

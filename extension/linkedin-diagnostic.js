// LinkedIn Diagnostic Script
// Run this in the console on LinkedIn to find the correct selectors

console.log('🔍 LinkedIn Diagnostic Tool');
console.log('============================\n');

// Test different selectors
const selectors = [
  '.feed-shared-update-v2',
  '.occludable-update',
  'div[data-urn]',
  'div[data-id*="urn:li:activity"]',
  'div.feed-shared-update-v2__content',
  'article',
  '[data-id^="urn:li:activity"]',
  '.feed-shared-update-v2__wrapper',
  'div[class*="feed-shared-update"]',
  'div[class*="occludable"]'
];

console.log('Testing selectors:\n');

selectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
      console.log('  ✅ First element:', elements[0]);
    }
  } catch (e) {
    console.log(`${selector}: ❌ Error - ${e.message}`);
  }
});

console.log('\n============================');
console.log('Looking for post links:\n');

// Find all links with /posts/ or activity
const allLinks = document.querySelectorAll('a');
let postLinks = [];

allLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href && (href.includes('/posts/') || href.includes('activity-'))) {
    postLinks.push({
      href: href,
      text: link.textContent.substring(0, 50),
      element: link
    });
  }
});

console.log(`Found ${postLinks.length} post links:`);
postLinks.slice(0, 5).forEach((link, i) => {
  console.log(`${i + 1}. ${link.href}`);
  console.log(`   Parent: ${link.element.parentElement.className}`);
  console.log(`   Grandparent: ${link.element.parentElement.parentElement.className}`);
});

console.log('\n============================');
console.log('Analyzing feed structure:\n');

// Find the main feed container
const feedContainers = [
  'main',
  '.scaffold-layout__main',
  '.feed-shared-update-v2',
  '[role="main"]',
  '.core-rail'
];

feedContainers.forEach(selector => {
  const container = document.querySelector(selector);
  if (container) {
    console.log(`✅ Found container: ${selector}`);
    console.log(`   Children: ${container.children.length}`);
    if (container.children.length > 0) {
      console.log(`   First child class: ${container.children[0].className}`);
    }
  }
});

console.log('\n============================');
console.log('Recommended selector:\n');

// Find the most common parent class for post links
const parentClasses = {};
postLinks.forEach(link => {
  let parent = link.element;
  for (let i = 0; i < 5; i++) {
    parent = parent.parentElement;
    if (parent && parent.className) {
      const classes = parent.className.split(' ');
      classes.forEach(cls => {
        if (cls && cls.includes('feed') || cls.includes('update') || cls.includes('post')) {
          parentClasses[cls] = (parentClasses[cls] || 0) + 1;
        }
      });
    }
  }
});

console.log('Most common parent classes:');
Object.entries(parentClasses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([cls, count]) => {
    console.log(`  .${cls}: ${count} occurrences`);
  });

console.log('\n============================');
console.log('Test complete! Copy the results above.');

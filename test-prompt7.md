# Prompt 7 Testing Checklist

## ✅ Server Status
- [x] Web server running on http://localhost:3000
- [x] API server running on http://localhost:3001
- [x] No compilation errors in terminal

## 🎨 Artwork Creation & Management Testing

### 1. Access Studio Artworks
- [ ] Navigate to http://localhost:3000/studio/artworks
- [ ] Verify authentication redirect if not logged in
- [ ] Verify artist profile exists and is accessible

### 2. Create New Artwork
- [ ] Click "New Artwork" button
- [ ] Test creating each artwork type:
  - [ ] Original Artwork
  - [ ] Limited Edition
  - [ ] Digital Artwork
- [ ] Verify redirect to edit page after creation

### 3. Edit Artwork Details
- [ ] Test Details tab:
  - [ ] Title validation (min 2, max 160 chars)
  - [ ] Description (max 2000 chars)
  - [ ] Year validation (1900-current year+1)
  - [ ] Medium and category selection
  - [ ] Dimensions input (width, height, depth in cm)
  - [ ] Framed checkbox
  - [ ] Price input (EUR, minor units)
- [ ] Verify slug generation (title-artist-year format)
- [ ] Test form validation and error messages

### 4. Upload Artwork Images
- [ ] Test Images tab:
  - [ ] Drag & drop image upload
  - [ ] Multiple image upload (max 10)
  - [ ] Image reordering via drag & drop
  - [ ] Set primary image functionality
  - [ ] Delete images
- [ ] Verify image positions and primary image logic

### 5. Manage Editions (for EDITIONED/DIGITAL)
- [ ] Test Editions tab (only for EDITIONED/DIGITAL):
  - [ ] Add print edition:
    - [ ] SKU validation
    - [ ] Run size and available quantity
    - [ ] Price per unit
    - [ ] Validation: available <= run size
  - [ ] Add digital edition:
    - [ ] SKU validation
    - [ ] Price
    - [ ] Optional download URL
  - [ ] Delete editions
  - [ ] Edit existing editions

### 6. Publish Artwork
- [ ] Test Publish tab:
  - [ ] View publication checklist
  - [ ] Verify KYC requirement (artist.kycStatus === "APPROVED")
  - [ ] Verify profile completion requirement (>= 80%)
  - [ ] Verify minimum requirements:
    - [ ] Title set
    - [ ] Price > 0
    - [ ] At least 1 image
    - [ ] Primary image set
    - [ ] For EDITIONED: at least 1 valid edition
    - [ ] For DIGITAL: at least 1 valid edition
  - [ ] Test publish button (enabled/disabled based on requirements)
  - [ ] Test unpublish functionality
  - [ ] Test delete artwork functionality

## 🌐 Public Visibility Testing

### 7. Artist Profile Display
- [ ] Navigate to http://localhost:3000/artist/[artist-slug]
- [ ] Verify published artworks appear in grid
- [ ] Verify artwork cards show:
  - [ ] Primary image
  - [ ] Title
  - [ ] Kind badge (Original/Editioned/Digital)
  - [ ] Price
- [ ] Verify only PUBLISHED artworks are shown
- [ ] Verify artworks are ordered by publishedAt (newest first)

### 8. Artwork PDP (Product Detail Page)
- [ ] Navigate to http://localhost:3000/artwork/[artwork-slug]
- [ ] Verify 404 for unpublished artworks
- [ ] Verify page displays:
  - [ ] Hero image (primary image)
  - [ ] Title and artist name
  - [ ] Price and currency
  - [ ] Dimensions (if set)
  - [ ] Medium and year (if set)
  - [ ] Description (if set)
  - [ ] Available editions (for EDITIONED/DIGITAL)
- [ ] Verify JSON-LD structured data is present
- [ ] Verify "View artist profile" link works

## 🔧 Technical Validation

### 9. Database Operations
- [ ] Verify artwork creation in database
- [ ] Verify image uploads and metadata storage
- [ ] Verify edition creation and validation
- [ ] Verify slug uniqueness
- [ ] Verify publish/unpublish status changes

### 10. Rate Limiting & Security
- [ ] Verify rate limiting on artwork operations
- [ ] Verify ownership guards (artist can only edit their own artworks)
- [ ] Verify authentication requirements
- [ ] Verify KYC gating for publishing

## 🎯 Success Criteria
- [ ] Artist can create all three artwork types
- [ ] Artist can edit details, upload images, manage editions
- [ ] Artist can publish when all requirements are met
- [ ] Published artworks appear on public artist profile
- [ ] Published artworks have working PDP pages
- [ ] All validation rules work correctly
- [ ] No TypeScript or runtime errors

## 🐛 Known Issues to Check
- [ ] Verify no "node:crypto" errors in web console
- [ ] Verify no Zod discriminated union errors
- [ ] Verify no missing UI component errors
- [ ] Verify image upload integration works with R2 storage

## 📝 Test Results
- [ ] All tests passing
- [ ] Ready to proceed to Prompt 8

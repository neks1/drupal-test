# Technical Explanation

## Architecture

Drupal acts as a UI layer and proxy between the browser and the external GraphQL API.

Instead of calling the external API directly from the browser, a custom module provides internal endpoints:

- `/api/items`
- `/api/items/{id}`

This allows:
- Controlled response format
- Centralized error handling
- Potential caching
- Avoiding browser-side cross-origin issues

---

## Data Flow

1. User opens `/items`
2. Drupal renders the page template
3. JavaScript reads the `page` parameter
4. JS requests `/api/items?page=...`
5. Drupal calls the external GraphQL API
6. Data is returned and rendered dynamically

---

## Rendering Strategy

Client-side rendering was used to support:
- Loading state
- Error state
- Empty state
- Pagination without full reload

---

## CSS Approach

- Component-based structure
- CSS Grid layout
- Mobile-first responsive design
- Clear spacing system
- Accessible focus styles
- No inline styles

---

## Possible Improvements

- Add Drupal Cache API for API responses
- Add filtering/search
- Add automated tests

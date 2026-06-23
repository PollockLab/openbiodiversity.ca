# Pictures Folder

Place your images for the **Who We Are** team members and **Our Partners** in this folder.

## Recommended File Names:
- Laura Pollock: `laura_pollock.jpg`
- Katherine Hébert: `katherine_hebert.jpg`
- Guillaume Larocque: `guillaume_larocque.jpg`
- Noah Wightman: `noah_wightman.jpg`
- Ryan Hull: `ryan_hull.jpg`
- Maho Horikawa: `maho_horikawa.jpg`

- Partner 1: `partner_1.jpg`
- Partner 2: `partner_2.jpg`
- Partner 3: `partner_3.jpg`
- Partner 4: `partner_4.jpg`
- Partner 5: `partner_5.jpg`

## How to use in code:
In `/src/components/AboutView.tsx`, import your photos at the top of the file, like so:
```typescript
import lauraPhoto from '../pictures/laura_pollock.jpg';
```
Then, update the `photo` property in the `teamMembers` or `partnersList` array to reference the imported photo variable instead of `null`.

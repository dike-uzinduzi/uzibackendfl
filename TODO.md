# Admin TODO

## Deferred security (do soon)
- [ ] Gate GET /api/plaques, /:id, /user/:userId with adminMiddleware
- [ ] Gate PUT/DELETE /api/plaques/:id with adminMiddleware
- [ ] Strip shippingAddress, verificationCode, verificationHash, ownerId, paymentId, adminNotes from non-admin responses
- [ ] Trim verifyPlaque response

## Next admin screens
- [ ] Payments — list, filter, revenue summary
- [ ] News — CRUD + news slot image upload
- [ ] Users role/suspend/verify actions (backend endpoints don't exist yet)

## Edit screen gaps
- [ ] Album edit: genres[], isDemo
- [ ] Track edit: releaseDate, soft-delete toggle
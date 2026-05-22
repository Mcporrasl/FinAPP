# Security Spec

## Data Invariants
1. Users can only read and write their own documents matching their auth.uid (`users/{userId}` and subcollections).
2. Users can only read and write family documents if they are authenticated and we verify existence of the family (due to limitations on nested role-based RBAC in single query, we'll keep it simple: users must be existing members of families to read/write, but since creating a family sets ownerId, ownerId = logged in user or they exist in `families/{familyId}/members/{userId}`).

Let's refine the family invariant:
Since `userId` is used as `memberId` in `families/{familyId}/members/{memberId}`, a user is a member if `exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid))` is true.
To create a family, the user should be allowed. We'll simplify and say only authed users can create families, and when they do, the `ownerId` must be `request.auth.uid`. To write members, goals, or transactions in the family, the user must be a member.

## The "Dirty Dozen" Payloads

1. Unauthenticated user trying to read `users/{userId}`. (Fails because unauthed).
2. Authenticated user A trying to read `users/{userB}`. (Fails because mismatch UID).
3. Payload with no `createdAt` field on create. (Fails schema).
4. `createdAt` not matching `request.time`. (Fails validation).
5. User trying to write string longer than allowed into `icon`.
6. Empty string in `userId`.
7. `ownerId` not matching `request.auth.uid` when creating family.
8. Writing to `families/{familyId}` when not owner or member.
9. Writing member to family they are not part of.
10. Shadow update: inserting an unexpected key like `isAdmin: true` in user update.
11. Update action that modifies immutable fields like `userId`.
12. Creating a family transaction when not a member of the family.

## Test Runner implementation placeholder (firestore.rules.test.ts)
(Red Team analysis will verify rules).

# Changelog

## [Unreleased]
### Added
- Visually improved monthly summary Discord embed: compact, emoji-rich, and grouped by currency for better clarity.

### Changed
- Refactored recurring invoice logic into `src/handlers/recurring.js` and removed the old `src/recurring.js` file.
- Moved all event type determination logic into their respective entity handler files for modularity.

### Fixed
- Client mapping in yearly payment summary now fetches client details correctly.

---

See previous commit history for earlier changes. 
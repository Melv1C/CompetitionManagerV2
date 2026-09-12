# Delete raw XML after interchange processing

AthleticsManager XML bytes are retained only long enough to complete a preview or committed import, then deleted after commit or preview expiry. The system retains the checksum, normalized import summary, mappings, conflicts, and audit data needed for review and idempotency, while avoiding unnecessary retention of personal-data XML.

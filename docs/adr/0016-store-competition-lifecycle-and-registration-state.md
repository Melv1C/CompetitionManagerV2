# Store Competition lifecycle and registration state independently

Competition lifecycle and registration availability are separate stored states rather than values derived only from timestamps. Configured times may schedule transitions, but authorized Organization Staff may override either state with a required Audit Entry, allowing publication before registration, controlled reopening, and an accurate record of operational decisions.

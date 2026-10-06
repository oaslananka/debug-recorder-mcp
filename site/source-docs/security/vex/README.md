# VEX decisions

Store temporary advisory decisions in this directory only when a finding cannot
be fixed before merge or release and the risk is documented as not exploitable,
scanner-only, optional-native, or development-only for supported use.

Use `_template.md` for every decision. Do not use VEX records to bypass a
runtime or release-path vulnerability. Every record must include an owner,
tracking issue or PR, mitigation, evidence, and a re-review date.

A decision expires on its re-review date. Remove the record when the finding is
fixed, no longer reported, or replaced by a more specific advisory record.

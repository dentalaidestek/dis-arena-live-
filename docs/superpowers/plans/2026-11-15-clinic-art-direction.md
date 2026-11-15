# Clinic art direction implementation plan

Goal: replace the rejected oversized mask-like patient and balloon-shaped doctors with a coherent clinical game diorama.

Design call: keep a normally proportioned patient in a recognizable dental chair, two standing clinicians, and an explicit magnified mouth study in the foreground. The patient's real mouth and magnified 28-tooth model share the same tooth state and fixed treatment target. No static scene images or generated video. Navy, porcelain, muted gum rose and teal; restrained gold for winners. Remove illegible per-tooth name/score plaques; FDI markers and a tap-to-inspect identity card replace them.

Constraints: existing React/Three.js stack, same branch/PR, no engine/rule/auth/database changes, no paid assets, no merge/deploy. Keep demo isolation and four queued procedures.

1. Add and test explicit patient/closeup tooth transforms so instruments cannot drift when the diorama is reframed.
2. Rebuild visual-only components: fitted human coat/trouser silhouettes, oval heads, subtle eyes/expressions, articulated arms; chair, task lamp, cabinets, instrument cart, floor and wall light.
3. Rework dental closeup: separate 28 crowns, concealed static roots, softer enamel, clean gum surround, FDI labels, target highlight and surgical tool. Both actual mouth and closeup animate the same cue.
4. Refine broadcast palette/spacing; keep all controls on /admin.
5. Run engine tests/build, publish the coherent visual package, run existing real Chromium acceptance, inspect mobile/OBS/extraction/implant captures and correct any visual defects. Save new screenshots and document actual limitations.

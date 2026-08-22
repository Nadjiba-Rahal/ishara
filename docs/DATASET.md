# Dataset Policy

ISHARA must not fabricate ALSL data.

## 3DZSignDB

Phase 4 targets 3DZSignDB as the first ALSL dictionary source.

Verified public metadata:

- Record: `3DZSignDB: 3D avatar SigML Data for Algerian Sign Language`
- DOI: `10.5281/zenodo.15020376`
- Repository: `https://github.com/linuxscout/algerianSignLanguage-avatar`
- Article: `3DZSignDB: 3D avatar SigML data for Algerian sign language`, Data in Brief 60, 2025, DOI `10.1016/j.dib.2025.111568`
- Authors: Taha Zerrouki, Mohamed Fares Slimani, Amine Mami, Redha Mazari
- License signals found during Phase 4 inspection: the Zenodo/GitHub project describes CC BY-NC-4.0, while the GitHub repository also contains GPL-3.0 software licensing. Treat imported data as non-commercial unless a later license review proves otherwise.

Verified structure:

- `data/categories_files.json` maps Arabic category names to Arabic sign labels/file names.
- `data/sigml/` contains individual SigML XML files for signs.
- The paper describes 417 ALSL lexical signs encoded with HamNoSys and stored as SigML files for 3D avatar rendering.

Current usage:

- The backend schema stores source name, source record id, Arabic label, category, optional HamNoSys, optional SigML, and optional media URL.
- The importer reads a local copy of `categories_files.json` plus a local SigML directory.
- No 3DZSignDB sign rows or SigML content are committed to this repository.
- Recognition training data is not created in Phase 4. SigML supports dictionary/avatar synthesis workflows first.

Before using any dataset:

1. Verify actual availability.
2. Inspect the license.
3. Document attribution requirements.
4. Avoid redistributing restricted data.
5. Build adapters rather than hard-coding dataset assumptions.

Train/validation/test splits must be signer-independent. Frames from the same recording must not be split across train and test.

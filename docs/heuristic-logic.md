# Cursor Git - Heuristic Logic Documentation

typing based:
Above a certain WPM is considered AI typing
below is human typing
if the following actions occur, it is considered human typing, despite WPM:
    - delete
    - copy/paste
    - backspace

This changes a flag that is either AI or human
When a file is saved, the auto-commit is performed or not based on the flag

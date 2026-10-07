# Fonts used by the house templates (kinetic, ctaGlass, logoPill)

Playfair Display (serif italic for prices, places and premium words) and Cinzel (the gold hook price), both SIL Open Font License, from github.com/google/fonts. Inter / Inter Display are expected to be installed system-wide.

The renderer (headless Chromium) finds fonts through fontconfig, so install these before rendering:

    mkdir -p ~/.local/share/fonts && cp gfx/fonts/*.ttf ~/.local/share/fonts/ && fc-cache -f

// tweaks-app.jsx · expressive controls for the apresentacao deck
// Three knobs that reshape the deck's feel, not single-property pixel-pushing:
//   · Palette  — recolors every surface + accent (Cream / Concrete / Blueprint)
//   · Voice    — reshapes typographic character (Editorial / Manifesto / Quiet)
//   · Texture  — surface treatment (Marks / Bare / Grain)
//
// Each knob writes a data-attribute onto <html> that the stylesheet keys off.

(function () {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "palette": "cream",
    "voice": "editorial",
    "texture": "marks"
  }/*EDITMODE-END*/;

  // Apply at boot so the first paint already reflects persisted values.
  document.documentElement.setAttribute('data-palette', TWEAK_DEFAULTS.palette);
  document.documentElement.setAttribute('data-voice', TWEAK_DEFAULTS.voice);
  document.documentElement.setAttribute('data-texture', TWEAK_DEFAULTS.texture);

  function PaletteSwatch({ colors }) {
    // Tiny inline preview — three stripes (background, accent, deep)
    return (
      <span style={{
        display: 'inline-flex',
        gap: 2,
        verticalAlign: 'middle',
        marginRight: 6,
        border: '0.5px solid rgba(0,0,0,0.18)',
        borderRadius: 3,
        overflow: 'hidden',
        height: 12,
      }}>
        {colors.map((c, i) => (
          <span key={i} style={{ width: 6, background: c, display: 'inline-block' }} />
        ))}
      </span>
    );
  }

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

    React.useEffect(() => {
      document.documentElement.setAttribute('data-palette', t.palette);
    }, [t.palette]);
    React.useEffect(() => {
      document.documentElement.setAttribute('data-voice', t.voice);
    }, [t.voice]);
    React.useEffect(() => {
      document.documentElement.setAttribute('data-texture', t.texture);
    }, [t.texture]);

    return (
      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakRadio
          label="Surface"
          value={t.palette}
          options={[
            { value: 'cream', label: 'Cream' },
            { value: 'concrete', label: 'Concrete' },
            { value: 'blueprint', label: 'Blueprint' },
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <div style={{
          fontSize: 11,
          color: 'rgba(41,38,27,.55)',
          lineHeight: 1.4,
          marginTop: -4,
        }}>
          {t.palette === 'cream' && 'Warm paper · green & amber accents · the default thesis register.'}
          {t.palette === 'concrete' && 'Drained grey · muted moss & clay · brutalist, monochrome.'}
          {t.palette === 'blueprint' && 'Cool navy · cobalt accent · technical-drawing feel.'}
        </div>

        <TweakSection label="Voice" />
        <TweakRadio
          label="Type"
          value={t.voice}
          options={[
            { value: 'editorial', label: 'Editorial' },
            { value: 'manifesto', label: 'Manifesto' },
            { value: 'quiet', label: 'Quiet' },
          ]}
          onChange={(v) => setTweak('voice', v)}
        />
        <div style={{
          fontSize: 11,
          color: 'rgba(41,38,27,.55)',
          lineHeight: 1.4,
          marginTop: -4,
        }}>
          {t.voice === 'editorial' && 'Newsreader serif · italic-as-emphasis · academic, lyrical.'}
          {t.voice === 'manifesto' && 'Geist Bold uppercase · weight-as-emphasis · loud and structured.'}
          {t.voice === 'quiet' && 'Geist Light · no italics · soft, gallery-catalogue restraint.'}
        </div>

        <TweakSection label="Texture" />
        <TweakRadio
          label="Surface"
          value={t.texture}
          options={[
            { value: 'marks', label: 'Marks' },
            { value: 'bare', label: 'Bare' },
            { value: 'grain', label: 'Grain' },
          ]}
          onChange={(v) => setTweak('texture', v)}
        />
        <div style={{
          fontSize: 11,
          color: 'rgba(41,38,27,.55)',
          lineHeight: 1.4,
          marginTop: -4,
        }}>
          {t.texture === 'marks' && 'Highlighter strokes & progress fills — the live deck.'}
          {t.texture === 'bare' && 'Marks and progress fills off — quiet document mode.'}
          {t.texture === 'grain' && 'SVG noise over everything — printed-paper feel.'}
        </div>
      </TweaksPanel>
    );
  }

  // Mount into its own host so it never collides with the deck DOM.
  const host = document.createElement('div');
  host.id = 'tweaks-host';
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<App />);
})();

export const defaultMenuSettings = {
  "melee": [
    {
      "id": "bce487e3-63a5-44d8-a9a8-b6bcd8ec5017",
      "label": "",
      "levels3d": {
        "type": "explosion",
        "data": {
          "color01": "#FFFFFF",
          "color02": "#FFFFFF",
          "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
        },
        "sound": {
          "enable": false
        },
        "secondary": {
          "enable": false,
          "data": {
            "color01": "#FFFFFF",
            "color02": "#FFFFFF",
            "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
          }
        }
      },
      "macro": {
        "enable": false
      },
      "meleeSwitch": {
        "video": {
          "dbSection": "range",
          "menuType": "weapon",
          "animation": "arrow",
          "variant": "regular",
          "color": "regular"
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "detect": "automatic",
          "range": 2,
          "returning": false,
          "switchType": "on"
        }
      },
      "menu": "melee",
      "primary": {
        "video": {
          "dbSection": "melee",
          "menuType": "weapon",
          "animation": "club",
          "variant": "01",
          "color": "white",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "isWait": false,
          "opacity": 1,
          "playbackRate": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "range": [
    {
      "id": "cde6c63d-cb31-43ca-8e96-5df2862f9528",
      "levels3d": {
        "type": "explosion",
        "data": {
          "color01": "#FFFFFF",
          "color02": "#FFFFFF",
          "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
        },
        "sound": {
          "enable": false
        },
        "secondary": {
          "enable": false,
          "data": {
            "color01": "#FFFFFF",
            "color02": "#FFFFFF",
            "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
          }
        }
      },
      "macro": {
        "enable": false
      },
      "menu": "range",
      "primary": {
        "video": {
          "dbSection": "range",
          "menuType": "weapon",
          "animation": "arrow",
          "variant": "regular",
          "color": "regular",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "isReturning": false,
          "isWait": false,
          "onlyX": false,
          "opacity": 1,
          "playbackRate": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "ontoken": [
    {
      "id": "1df6fa89-3ee2-4567-a0dc-5c4736b618d5",
      "levels3d": {
        "type": "explosion",
        "data": {
          "color01": "#FFFFFF",
          "color02": "#FFFFFF",
          "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
        },
        "sound": {
          "enable": false
        },
        "secondary": {
          "enable": false,
          "data": {
            "color01": "#FFFFFF",
            "color02": "#FFFFFF",
            "spritePath": "modules/levels-3d-preview/assets/particles/dust.png"
          }
        }
      },
      "macro": {
        "enable": false
      },
      "menu": "ontoken",
      "primary": {
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": false,
          "opacity": 1,
          "persistent": false,
          "playbackRate": 1,
          "playOn": "default",
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "templatefx": [
    {
      "id": "7eed5393-7e10-4e0d-99f4-56c7b8e0c9cb",
      "macro": {
        "enable": false
      },
      "menu": "templatefx",
      "primary": {
        "video": {
          "dbSection": "templatefx",
          "menuType": "circle",
          "animation": "calllightning",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "isMasked": false,
          "isWait": false,
          "occlusionAlpha": 0.5,
          "occlusionMode": "3",
          "opacity": 1,
          "persistent": false,
          "persistType": "sequencerground",
          "playbackRate": 1,
          "removeTemplate": false,
          "repeat": 1,
          "repeatDelay": 250,
          "rotate": 0,
          "saturate": 0,
          "scale": "1",
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "aura": [
    {
      "id": "ed83a8a5-e7e9-4904-8482-635e748ab572",
      "macro": {
        "enable": false
      },
      "menu": "aura",
      "primary": {
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "spiritguardians",
          "variant": "01",
          "color": "yellowblue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": true,
          "alpha": false,
          "alphaMax": 0.5,
          "alphaMin": -0.5,
          "alphaDuration": 1000,
          "breath": false,
          "breathMax": 1.05,
          "breathMin": 0.95,
          "breathDuration": 1000,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "playbackRate": 1,
          "playOn": "source",
          "size": 3,
          "tint": false,
          "tintColor": "#FFFFFF",
          "tintSaturate": 0,
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "preset": [
    {
      "id": "823abf3d-886d-4d32-9ca5-24aae6d5435d",
      "data": {
        "projectile": {
          "dbSection": "range",
          "menuType": "weapon",
          "animation": "arrow",
          "variant": "regular",
          "color": "regular",
          "enableCustom": false,
          "customPath": "",
          "options": {
            "elevation": 1000,
            "opacity": 1,
            "playbackRate": 1,
            "repeat": 1,
            "repeatDelay": 250,
            "removeTemplate": false,
            "wait": -1800
          },
          "sound": {
            "enable": false,
            "delay": 0,
            "repeat": 1,
            "repeatDelay": 250,
            "startTime": 0,
            "volume": 0.75
          }
        },
        "preExplosion": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "options": {
            "elevation": 1000,
            "opacity": 1,
            "playbackRate": 1,
            "repeat": 1,
            "repeatDelay": 250,
            "scale": 1,
            "wait": 0
          },
          "enable": false,
          "sound": {
            "enable": false,
            "delay": 0,
            "repeat": 1,
            "repeatDelay": 250,
            "startTime": 0,
            "volume": 0.75
          }
        },
        "explosion": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "options": {
            "elevation": 1000,
            "opacity": 1,
            "playbackRate": 1,
            "repeat": 1,
            "repeatDelay": 250,
            "scale": 1.25,
            "wait": -1000
          },
          "sound": {
            "enable": false,
            "delay": 0,
            "repeat": 1,
            "repeatDelay": 250,
            "startTime": 0,
            "volume": 0.75
          }
        },
        "afterImage": {
          "enable": false,
          "customPath": "",
          "options": {
            "elevation": 0,
            "persistent": false,
            "scale": 1
          }
        }
      },
      "label": "",
      "macro": {
        "enable": false
      },
      "menu": "preset",
      "presetType": "proToTemp",
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "target": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "opacity": 1,
          "persistent": false,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "aefx": [
    {
      "id": "29a1c4c4-13b4-4c2c-a8d4-942e2f1715f2",
      "label": "",
      "activeEffectType": "ontoken",
      "menu": "aefx",
      "macro": {
        "enable": false
      },
      "primary": {
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": false,
          "opacity": 1,
          "persistent": false,
          "playbackRate": 1,
          "playOn": "source",
          "repeat": 1,
          "repeatDelay": 250,
          "size": 1,
          "unbindAlpha": false,
          "unbindVisibility": false,
          "zIndex": 1
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "secondary": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": true,
          "isWait": false,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1.5,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "soundOnly": {
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        }
      },
      "source": {
        "enable": false,
        "video": {
          "dbSection": "static",
          "menuType": "spell",
          "animation": "curewounds",
          "variant": "01",
          "color": "blue",
          "enableCustom": false,
          "customPath": ""
        },
        "sound": {
          "enable": false,
          "delay": 0,
          "repeat": 1,
          "repeatDelay": 250,
          "startTime": 0,
          "volume": 0.75
        },
        "options": {
          "addTokenWidth": false,
          "anchor": "0.5",
          "contrast": 0,
          "delay": 0,
          "elevation": 1000,
          "fadeIn": 250,
          "fadeOut": 500,
          "isMasked": false,
          "isRadius": false,
          "isWait": true,
          "opacity": 1,
          "repeat": 1,
          "repeatDelay": 250,
          "saturate": 0,
          "size": 1,
          "tint": false,
          "tintColor": "#FFFFFF",
          "zIndex": 1
        }
      },
      "advanced": {
        "exactMatch": true,
        "excludedTerms": [],
        "excludedType": {
          "enabled": false,
          "path": "",
          "property": ""
        }
      }
    }
  ],
  "version": 5
}
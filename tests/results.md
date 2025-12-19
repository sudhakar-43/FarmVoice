# FarmVoice Acceptance Test Results

## Scenario: 1. First Login & Crop Selection
- **Status**: PASS
- **Time**: 2025-12-03T23:37:11.665682
- **Details**: 
```json
{
  "status": "ready",
  "user": {
    "user_id": "test_user_1",
    "name": null,
    "phone": null,
    "pincode": null,
    "state": null,
    "lat": 20.59,
    "lon": 78.96,
    "active_crop": "Rice",
    "last_login_at": null
  },
  "weather": {
    "current": {
      "temp_c": 18.8,
      "humidity": 71,
      "precip_mm": 0.0,
      "wind_kph": 4.0
    },
    "forecast": [
      {
        "date": "2025-12-03",
        "max_temp": 28.1,
        "min_temp": 14.9,
        "precip_mm": 0.0,
        "wind_max_kph": 8.6
      },
      {
        "date": "2025-12-04",
        "max_temp": 28.5,
        "min_temp": 15.3,
        "precip_mm": 0.0,
        "wind_max_kph": 7.8
      },
      {
        "date": "2025-12-05",
        "max_temp": 28.4,
        "min_temp": 14.4,
        "precip_mm": 0.0,
        "wind_max_kph": 8.7
      },
      {
        "date": "2025-12-06",
        "max_temp": 27.5,
        "min_temp": 13.1,
        "precip_mm": 0.0,
        "wind_max_kph": 8.8
      },
      {
        "date": "2025-12-07",
        "max_temp": 27.3,
        "min_temp": 13.6,
        "precip_mm": 0.0,
        "wind_max_kph": 7.4
      },
      {
        "date": "2025-12-08",
        "max_temp": 28.7,
        "min_temp": 13.0,
        "precip_mm": 0.0,
        "wind_max_kph": 10.2
      },
      {
        "date": "2025-12-09",
        "max_temp": 29.2,
        "min_temp": 13.6,
        "precip_mm": 0.0,
        "wind_max_kph": 8.9
      },
      {
        "date": "2025-12-10",
        "max_temp": 28.4,
        "min_temp": 13.9,
        "precip_mm": 0.0,
        "wind_max_kph": 5.6
      },
      {
        "date": "2025-12-11",
        "max_temp": 27.9,
        "min_temp": 13.9,
        "precip_mm": 0.0,
        "wind_max_kph": 7.4
      },
      {
        "date": "2025-12-12",
        "max_temp": 28.1,
        "min_temp": 14.9,
        "precip_mm": 0.0,
        "wind_max_kph": 11.0
      }
    ],
    "_provenance": "cached"
  },
  "active_crop": "Rice",
  "plan": {
    "lanes": [
      {
        "date": "2025-12-02",
        "label": "Yesterday",
        "tasks": [
          {
            "id": "water-20251202",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          },
          {
            "id": "rec-20251202",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-03",
        "label": "Today",
        "tasks": [
          {
            "id": "insp-20251203",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-04",
        "label": "Tomorrow",
        "tasks": [
          {
            "id": "rec-20251204",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-05",
        "label": "Fri, 05 Dec",
        "tasks": [
          {
            "id": "insp-20251205",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "water-20251205",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-06",
        "label": "Sat, 06 Dec",
        "tasks": [
          {
            "id": "rec-20251206",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-07",
        "label": "Sun, 07 Dec",
        "tasks": [
          {
            "id": "insp-20251207",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "spray-20251207",
            "verb": "Spray",
            "text": "Apply preventative fungicide",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-08",
        "label": "Mon, 08 Dec",
        "tasks": [
          {
            "id": "water-20251208",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          },
          {
            "id": "rec-20251208",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-09",
        "label": "Tue, 09 Dec",
        "tasks": [
          {
            "id": "insp-20251209",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-10",
        "label": "Wed, 10 Dec",
        "tasks": [
          {
            "id": "rec-20251210",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-11",
        "label": "Thu, 11 Dec",
        "tasks": [
          {
            "id": "insp-20251211",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "water-20251211",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-12",
        "label": "Fri, 12 Dec",
        "tasks": [
          {
            "id": "rec-20251212",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-13",
        "label": "Sat, 13 Dec",
        "tasks": [
          {
            "id": "insp-20251213",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      }
    ]
  }
}
```

## Scenario: 2. Returning User Sliding Window
- **Status**: PASS
- **Time**: 2025-12-03T23:37:11.672923
- **Details**: 
```json
{
  "today_lane": {
    "date": "2025-12-03",
    "label": "Today",
    "tasks": [
      {
        "id": "insp-20251203",
        "verb": "Inspect",
        "text": "Inspect Rice field for pests",
        "status": "pending"
      }
    ]
  }
}
```

## Scenario: 3. Rain Strike Logic
- **Status**: PASS
- **Time**: 2025-12-03T23:37:11.673685
- **Details**: 
```json
[
  {
    "id": "insp-20251203",
    "verb": "Inspect",
    "text": "Inspect Rice field for pests",
    "status": "pending"
  },
  {
    "id": "water-20251203",
    "verb": "Irrigate",
    "text": "Irrigate Rice field",
    "status": "cancelled",
    "reason": "Raining \u2014 no need to water today"
  }
]
```

## Scenario: 4. Disease Alert Logic
- **Status**: PASS
- **Time**: 2025-12-03T23:37:11.675838
- **Details**: 
```json
{
  "score": 5,
  "level": "High",
  "factors": [
    "High humidity/rain",
    "Optimal fungal temp"
  ],
  "advice": "High risk of fungal diseases in Rice. Monitor closely and consider preventative spray."
}
```

## Scenario: 5. Market Page
- **Status**: PASS
- **Time**: 2025-12-03T23:37:11.681232
- **Details**: 
```json
{
  "prices": [
    {
      "state": "Andhra Pradesh",
      "district": "Guntur",
      "market": "Guntur",
      "commodity": "Chilli Red",
      "variety": "Dry",
      "min_price": "12000",
      "max_price": "15000",
      "modal_price": "13500",
      "date": "2023-10-25",
      "_provenance": "local_csv"
    }
  ],
  "trends": {
    "trend": "stable",
    "change_percent": 0
  }
}
```

## Scenario: 1. First Login & Crop Selection
- **Status**: PASS
- **Time**: 2025-12-05T21:55:03.246348
- **Details**: 
```json
{
  "status": "ready",
  "user": {
    "user_id": "test_user_1",
    "name": null,
    "phone": null,
    "pincode": null,
    "state": null,
    "lat": 20.59,
    "lon": 78.96,
    "active_crop": "Rice",
    "last_login_at": null
  },
  "weather": {
    "current": {
      "temp_c": 19.2,
      "humidity": 65,
      "precip_mm": 0.0,
      "wind_kph": 4.2
    },
    "forecast": [
      {
        "date": "2025-12-05",
        "max_temp": 27.7,
        "min_temp": 13.5,
        "precip_mm": 0.0,
        "wind_max_kph": 9.2
      },
      {
        "date": "2025-12-06",
        "max_temp": 27.4,
        "min_temp": 14.0,
        "precip_mm": 0.0,
        "wind_max_kph": 7.4
      },
      {
        "date": "2025-12-07",
        "max_temp": 27.2,
        "min_temp": 13.8,
        "precip_mm": 0.0,
        "wind_max_kph": 7.3
      },
      {
        "date": "2025-12-08",
        "max_temp": 28.8,
        "min_temp": 13.2,
        "precip_mm": 0.0,
        "wind_max_kph": 9.3
      },
      {
        "date": "2025-12-09",
        "max_temp": 28.6,
        "min_temp": 13.6,
        "precip_mm": 0.0,
        "wind_max_kph": 10.4
      },
      {
        "date": "2025-12-10",
        "max_temp": 27.4,
        "min_temp": 12.7,
        "precip_mm": 0.0,
        "wind_max_kph": 6.9
      },
      {
        "date": "2025-12-11",
        "max_temp": 27.4,
        "min_temp": 10.9,
        "precip_mm": 0.0,
        "wind_max_kph": 3.8
      },
      {
        "date": "2025-12-12",
        "max_temp": 27.9,
        "min_temp": 11.3,
        "precip_mm": 0.0,
        "wind_max_kph": 4.6
      },
      {
        "date": "2025-12-13",
        "max_temp": 27.5,
        "min_temp": 13.1,
        "precip_mm": 0.0,
        "wind_max_kph": 9.9
      },
      {
        "date": "2025-12-14",
        "max_temp": 27.8,
        "min_temp": 13.7,
        "precip_mm": 0.0,
        "wind_max_kph": 11.5
      }
    ],
    "_provenance": "cached"
  },
  "active_crop": "Rice",
  "plan": {
    "lanes": [
      {
        "date": "2025-12-04",
        "label": "Yesterday",
        "tasks": [
          {
            "id": "rec-20251204",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-05",
        "label": "Today",
        "tasks": [
          {
            "id": "insp-20251205",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "water-20251205",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          },
          {
            "id": "soil-20251205",
            "verb": "Inspect",
            "text": "Check soil pH level",
            "status": "pending",
            "tag": "soil pH needed"
          }
        ]
      },
      {
        "date": "2025-12-06",
        "label": "Tomorrow",
        "tasks": [
          {
            "id": "rec-20251206",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-07",
        "label": "Sun, 07 Dec",
        "tasks": [
          {
            "id": "insp-20251207",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "spray-20251207",
            "verb": "Spray",
            "text": "Apply preventative fungicide",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-08",
        "label": "Mon, 08 Dec",
        "tasks": [
          {
            "id": "water-20251208",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          },
          {
            "id": "rec-20251208",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-09",
        "label": "Tue, 09 Dec",
        "tasks": [
          {
            "id": "insp-20251209",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-10",
        "label": "Wed, 10 Dec",
        "tasks": [
          {
            "id": "rec-20251210",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-11",
        "label": "Thu, 11 Dec",
        "tasks": [
          {
            "id": "insp-20251211",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          },
          {
            "id": "water-20251211",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-12",
        "label": "Fri, 12 Dec",
        "tasks": [
          {
            "id": "rec-20251212",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-13",
        "label": "Sat, 13 Dec",
        "tasks": [
          {
            "id": "insp-20251213",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-14",
        "label": "Sun, 14 Dec",
        "tasks": [
          {
            "id": "water-20251214",
            "verb": "Irrigate",
            "text": "Irrigate Rice field",
            "status": "pending"
          },
          {
            "id": "spray-20251214",
            "verb": "Spray",
            "text": "Apply preventative fungicide",
            "status": "pending"
          },
          {
            "id": "rec-20251214",
            "verb": "Record",
            "text": "Record crop growth observations",
            "status": "pending"
          }
        ]
      },
      {
        "date": "2025-12-15",
        "label": "Mon, 15 Dec",
        "tasks": [
          {
            "id": "insp-20251215",
            "verb": "Inspect",
            "text": "Inspect Rice field for pests",
            "status": "pending"
          }
        ]
      }
    ]
  }
}
```

## Scenario: 2. Returning User Sliding Window
- **Status**: PASS
- **Time**: 2025-12-05T21:55:03.254775
- **Details**: 
```json
{
  "today_lane": {
    "date": "2025-12-05",
    "label": "Today",
    "tasks": [
      {
        "id": "insp-20251205",
        "verb": "Inspect",
        "text": "Inspect Rice field for pests",
        "status": "pending"
      },
      {
        "id": "water-20251205",
        "verb": "Irrigate",
        "text": "Irrigate Rice field",
        "status": "pending"
      },
      {
        "id": "soil-20251205",
        "verb": "Inspect",
        "text": "Check soil pH level",
        "status": "pending",
        "tag": "soil pH needed"
      }
    ]
  }
}
```

## Scenario: 3. Rain Strike Logic
- **Status**: PASS
- **Time**: 2025-12-05T21:55:03.257427
- **Details**: 
```json
[
  {
    "id": "insp-20251205",
    "verb": "Inspect",
    "text": "Inspect Rice field for pests",
    "status": "pending"
  },
  {
    "id": "water-20251205",
    "verb": "Irrigate",
    "text": "Irrigate Rice field",
    "status": "cancelled",
    "reason": "Raining \u2014 no need to water today"
  },
  {
    "id": "soil-20251205",
    "verb": "Inspect",
    "text": "Check soil pH level",
    "status": "pending",
    "tag": "soil pH needed"
  }
]
```

## Scenario: 4. Disease Alert Logic
- **Status**: PASS
- **Time**: 2025-12-05T21:55:03.258433
- **Details**: 
```json
{
  "score": 5,
  "level": "High",
  "factors": [
    "High humidity/rain",
    "Optimal fungal temp"
  ],
  "advice": "High risk of fungal diseases in Rice. Monitor closely and consider preventative spray."
}
```

## Scenario: 5. Market Page
- **Status**: PASS
- **Time**: 2025-12-05T21:55:03.264600
- **Details**: 
```json
{
  "prices": [
    {
      "state": "Andhra Pradesh",
      "district": "Guntur",
      "market": "Guntur",
      "commodity": "Chilli Red",
      "variety": "Dry",
      "min_price": "12000",
      "max_price": "15000",
      "modal_price": "13500",
      "date": "2023-10-25",
      "_provenance": "local_csv"
    }
  ],
  "trends": {
    "trend": "stable",
    "change_percent": 0
  }
}
```

## Scenario: 6. Voice Turn (Simulated)
- **Status**: FAIL
- **Time**: 2025-12-05T21:55:05.304247
- **Details**: 
```json
Planner failed: None
```


/**
 * Utility functions for translating text using DeepL API
 */

/**
 * Common serving measure translations to avoid unnecessary API calls
 */
const commonServingMeasures: Record<string, string> = {
  serving: "porção",
  cup: "xícara",
  "cup, mashed": "xícara, amassado",
  "cup, sliced": "xícara, fatiado",
  'extra small (less than 6" long)': "extra pequeno (menos de 15 cm)",
  'small (6" to 6-7/8" long)': "pequeno (15 cm a 17,5 cm)",
  'medium (7" to 7-7/8" long)': "médio (17,5 cm a 20 cm)",
  'large (8" to 8-7/8" long)': "grande (20 cm a 22,5 cm)",
  'extra large (9" or longer)': "extra grande (23 cm ou mais)",
  "NLEA serving": "porção NLEA",
  oz: "oz",
  g: "g",
  tbsp: "colher de sopa",
  tsp: "colher de chá",
  slice: "fatia",
  piece: "pedaço",
  whole: "inteiro",
  package: "pacote",
  container: "recipiente",
  bottle: "garrafa",
  can: "lata",
  bowl: "tigela",
  plate: "prato",
  scoop: "concha",
  handful: "punhado",
  unit: "unidade",
  medium: "médio",
  large: "grande",
  small: "pequeno",
}

/**
 * Translates text from Portuguese to English using DeepL API
 * @param {string} text - The text to translate
 * @returns {Promise<string>} - The translated text
 */
export async function translatePtToEn(text: string): Promise<string> {
  try {
    // Don't translate empty text
    if (!text || text.trim() === "") {
      return text
    }

    // Check if text is already in English (simple heuristic)
    // This helps avoid unnecessary API calls
    const commonEnglishWords = ["the", "a", "an", "and", "or", "but", "apple", "banana", "chicken"]
    const words = text.toLowerCase().split(/\s+/)
    const possiblyEnglish = words.some((word) => commonEnglishWords.includes(word))

    if (possiblyEnglish) {
      console.log(`Text "${text}" appears to be in English already, skipping translation`)
      return text
    }

    console.log(`Attempting to translate from PT to EN: "${text}"`)

    // Get DeepL API key from environment variables
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY

    if (!DEEPL_API_KEY) {
      console.error("Missing DeepL API key")
      return text // Return original text if API key is missing
    }

    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        },
        body: JSON.stringify({
          text: [text],
          source_lang: "PT",
          target_lang: "EN",
        }),
      })

      // Check if the response is OK
      if (!response.ok) {
        let errorMessage = `DeepL API error (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage += `: ${JSON.stringify(errorData)}`
        } catch (e) {
          // If we can't parse the error as JSON, try to get the text
          try {
            const errorText = await response.text()
            errorMessage += `: ${errorText}`
          } catch (e2) {
            // If we can't get the text either, just use the status
            errorMessage += `: Unknown error`
          }
        }
        console.error(errorMessage)
        return text // Return original text on error
      }

      const data = await response.json()

      // Extract the translated text from the response
      const translatedText = data.translations?.[0]?.text || text

      console.log(`Translation result: "${translatedText}"`)
      return translatedText
    } catch (fetchError) {
      console.error("Error calling DeepL API:", fetchError)
      return text // Return original text on error
    }
  } catch (error) {
    console.error("Error in translation function:", error)
    return text // Return original text on error
  }
}

/**
 * Translates text from English to Portuguese using DeepL API
 * @param {string} text - The text to translate
 * @returns {Promise<string>} - The translated text
 */
export async function translateEnToPt(text: string): Promise<string> {
  try {
    // Don't translate empty text
    if (!text || text.trim() === "") {
      return text
    }

    // Check if text is already in Portuguese (simple heuristic)
    // This helps avoid unnecessary API calls
    const commonPortugueseWords = ["o", "a", "os", "as", "e", "ou", "mas", "maçã", "banana", "frango"]
    const words = text.toLowerCase().split(/\s+/)
    const possiblyPortuguese = words.some((word) => commonPortugueseWords.includes(word))

    if (possiblyPortuguese) {
      console.log(`Text "${text}" appears to be in Portuguese already, skipping translation`)
      return text
    }

    // Check if it's a common serving measure we already know
    if (commonServingMeasures[text]) {
      console.log(`Using cached translation for "${text}": "${commonServingMeasures[text]}"`)
      return commonServingMeasures[text]
    }

    console.log(`Attempting to translate from EN to PT: "${text}"`)

    // Get DeepL API key from environment variables
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY

    if (!DEEPL_API_KEY) {
      console.error("Missing DeepL API key")
      return text // Return original text if API key is missing
    }

    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        },
        body: JSON.stringify({
          text: [text],
          source_lang: "EN",
          target_lang: "PT-BR",
        }),
      })

      // Check if the response is OK
      if (!response.ok) {
        let errorMessage = `DeepL API error (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage += `: ${JSON.stringify(errorData)}`
        } catch (e) {
          // If we can't parse the error as JSON, try to get the text
          try {
            const errorText = await response.text()
            errorMessage += `: ${errorText}`
          } catch (e2) {
            // If we can't get the text either, just use the status
            errorMessage += `: Unknown error`
          }
        }
        console.error(errorMessage)
        return text // Return original text on error
      }

      const data = await response.json()

      // Extract the translated text from the response
      const translatedText = data.translations?.[0]?.text || text

      console.log(`Translation result: "${translatedText}"`)
      return translatedText
    } catch (fetchError) {
      console.error("Error calling DeepL API:", fetchError)
      return text // Return original text on error
    }
  } catch (error) {
    console.error("Error in translation function:", error)
    return text // Return original text on error
  }
}

/**
 * Translates an array of food items from English to Portuguese
 * @param {Array} items - Array of food items with food_name property
 * @returns {Promise<Array>} - Array of food items with translated food_name
 */
export async function translateFoodItems(items: any[]): Promise<any[]> {
  if (!items || items.length === 0) {
    return items
  }

  try {
    // Extract all food names to translate
    const foodNames = items.map((item) => item.food_name).filter(Boolean)

    if (foodNames.length === 0) {
      return items
    }

    // Translate all food names in a single batch
    const translatedNames = await Promise.all(foodNames.map((name) => translateEnToPt(name)))

    // Create a mapping of original to translated names
    const translationMap = foodNames.reduce(
      (map, name, index) => {
        map[name] = translatedNames[index]
        return map
      },
      {} as Record<string, string>,
    )

    // Apply translations to the items
    return items.map((item) => {
      if (item.food_name && translationMap[item.food_name]) {
        return {
          ...item,
          original_food_name: item.food_name, // Keep the original name
          food_name: translationMap[item.food_name], // Set the translated name
        }
      }
      return item
    })
  } catch (error) {
    console.error("Error translating food items:", error)
    return items // Return original items on error
  }
}

/**
 * Translates serving measures from English to Portuguese
 * @param {string} measure - The serving measure to translate
 * @returns {Promise<string>} - The translated serving measure
 */
export async function translateServingMeasure(measure: string): Promise<string> {
  // Check if it's a common measure we already know
  if (commonServingMeasures[measure]) {
    return commonServingMeasures[measure]
  }

  // Otherwise, use the DeepL API
  return translateEnToPt(measure)
}

/**
 * Translates an array of alternative measures from English to Portuguese
 * @param {Array} measures - Array of alternative measures
 * @returns {Promise<Array>} - Array of measures with translated measure names
 */
export async function translateAltMeasures(measures: any[]): Promise<any[]> {
  if (!measures || measures.length === 0) {
    return measures
  }

  try {
    // Process each measure
    const translatedMeasures = await Promise.all(
      measures.map(async (measure) => {
        if (!measure.measure) return measure

        // Store the original measure
        const originalMeasure = measure.measure

        // Translate the measure
        const translatedMeasure = await translateServingMeasure(originalMeasure)

        return {
          ...measure,
          original_measure: originalMeasure,
          measure: translatedMeasure,
        }
      }),
    )

    return translatedMeasures
  } catch (error) {
    console.error("Error translating alternative measures:", error)
    return measures // Return original measures on error
  }
}

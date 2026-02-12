/**
 * Utility functions for validating image aspect ratios
 */

/**
 * Get image dimensions from a File object
 * @param file - The image file
 * @returns Promise with width and height
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate aspect ratio from dimensions
 * @param width - Image width
 * @param height - Image height
 * @returns Aspect ratio as a decimal (e.g., 1.0 for 1:1, 0.5625 for 9:16)
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Check if an image has a 1:1 (square) aspect ratio
 * @param width - Image width
 * @param height - Image height
 * @param tolerance - Acceptable tolerance (default 0.05 = 5%)
 * @returns True if the image is square within tolerance
 */
export function isSquareImage(
  width: number,
  height: number,
  tolerance: number = 0.05
): boolean {
  const ratio = calculateAspectRatio(width, height);
  return Math.abs(ratio - 1.0) <= tolerance;
}

/**
 * Check if an image has a 9:16 (vertical/story) aspect ratio
 * @param width - Image width
 * @param height - Image height
 * @param tolerance - Acceptable tolerance (default 0.05 = 5%)
 * @returns True if the image is 9:16 within tolerance
 */
export function isVerticalStoryImage(
  width: number,
  height: number,
  tolerance: number = 0.05
): boolean {
  const ratio = calculateAspectRatio(width, height);
  const targetRatio = 9 / 16; // 0.5625
  return Math.abs(ratio - targetRatio) <= tolerance;
}

/**
 * Validate image aspect ratio for items (must be 1:1)
 * @param file - The image file to validate
 * @returns Promise that resolves to validation result
 */
export async function validateItemImage(
  file: File
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> {
  try {
    const dimensions = await getImageDimensions(file);
    const isSquare = isSquareImage(dimensions.width, dimensions.height);

    if (!isSquare) {
      return {
        valid: false,
        message: `A imagem deve ser quadrada (1:1). A imagem enviada é ${dimensions.width}x${dimensions.height}px. Exemplo: 500x500px, 1000x1000px`,
        dimensions,
      };
    }

    return {
      valid: true,
      dimensions,
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Erro ao validar a imagem. Certifique-se de que é um arquivo de imagem válido.',
    };
  }
}

/**
 * Validate image aspect ratio for portfolio (1:1 or 9:16)
 * @param file - The image file to validate
 * @returns Promise that resolves to validation result
 */
export async function validatePortfolioImage(
  file: File
): Promise<{ valid: boolean; message?: string; dimensions?: { width: number; height: number } }> {
  try {
    const dimensions = await getImageDimensions(file);
    const isSquare = isSquareImage(dimensions.width, dimensions.height);
    const isVertical = isVerticalStoryImage(dimensions.width, dimensions.height);

    if (!isSquare && !isVertical) {
      return {
        valid: false,
        message: `A imagem deve ter proporção 1:1 (quadrada) ou 9:16 (vertical). A imagem enviada é ${dimensions.width}x${dimensions.height}px. Exemplos válidos: 1080x1080px, 1080x1920px`,
        dimensions,
      };
    }

    return {
      valid: true,
      dimensions,
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Erro ao validar a imagem. Certifique-se de que é um arquivo de imagem válido.',
    };
  }
}

# Haar Cascade Files
This folder should contain the Haar Cascade XML files for face detection.

## Required File
- `haarcascade_frontalface_default.xml`

## How to Get the File
The file is included with OpenCV. You can either:

1. **Copy from OpenCV installation:**
   The file is typically located at:
   - Windows: `C:\PythonXX\Lib\site-packages\cv2\data\haarcascade_frontalface_default.xml`
   - Linux: `/usr/local/lib/pythonX.X/site-packages/cv2/data/haarcascade_frontalface_default.xml`
   - macOS: Similar to Linux path

2. **Download from OpenCV GitHub:**
   https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml

3. **Use OpenCV's built-in path (automatic):**
   The code will automatically fall back to `cv2.data.haarcascades` if the local file is not found.

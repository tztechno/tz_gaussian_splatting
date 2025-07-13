
# resize image and camera info

target_width = 400

for image in recon.images.values():
    img_path = image_dir / image.name
    img_pil = Image.open(img_path)

    W0, H0 = img_pil.size

    resized_img = resize_with_aspect(img_pil, target_width)
    W1, H1 = resized_img.size  

    img = np.array(resized_img) / 255.0
    all_images.append(img)

    cam = recon.cameras[image.camera_id]
    fx, fy = cam.params[0], cam.params[1]
    cx, cy = cam.params[2], cam.params[3]

    scale_x = W1 / W0
    scale_y = H1 / H0

    fx_resized = fx * scale_x
    fy_resized = fy * scale_y
    cx_resized = cx * scale_x
    cy_resized = cy * scale_y

    intrinsics = np.array([
        [fx_resized, 0, cx_resized],
        [0, fy_resized, cy_resized],
        [0,     0,          1]
    ])
    all_intrinsics.append(intrinsics)

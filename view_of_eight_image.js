import React, { useState, useEffect, useMemo } from 'react';

const GaussianSplatting8Images = () => {
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(10);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 8枚の画像の角度（45度間隔）
  const imageAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const imageLabels = ['正面', '右前', '右', '右後', '後方', '左後', '左', '左前'];

  // シーンの3Dポイントを生成（環境を模擬）
  const generateScene = useMemo(() => {
    const points = [];
    const colors = [];
    
    // 地面（緑）
    for (let i = 0; i < 1000; i++) {
      points.push([
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        Math.random() * 0.5
      ]);
      colors.push([0.2, 0.8, 0.3]);
    }
    
    // 建物（グレー）
    for (let i = 0; i < 800; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = Math.random() * 15 + 2;
      points.push([x, y, z]);
      colors.push([0.6, 0.6, 0.7]);
    }
    
    // 木々（緑-茶色）
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15 + 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.random() * 8 + 1;
      points.push([x, y, z]);
      colors.push([0.1 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.1]);
    }
    
    // 車両（赤）
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 12 + 3;
      points.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        1.5 + Math.random() * 1
      ]);
      colors.push([0.8, 0.2, 0.2]);
    }

    return { points, colors };
  }, []);

  // 8枚の画像からの補間（Gaussian Splattingの簡易シミュレーション）
  const interpolateFromImages = (currentAzimuth) => {
    let lowerIndex = 0;
    let upperIndex = 0;
    
    for (let i = 0; i < imageAngles.length; i++) {
      if (imageAngles[i] <= currentAzimuth) {
        lowerIndex = i;
      } else {
        upperIndex = i;
        break;
      }
    }
    
    if (currentAzimuth > imageAngles[imageAngles.length - 1]) {
      lowerIndex = imageAngles.length - 1;
      upperIndex = 0;
    }
    
    const lowerAngle = imageAngles[lowerIndex];
    const upperAngle = upperIndex === 0 ? 360 : imageAngles[upperIndex];
    const angleDiff = upperAngle - lowerAngle;
    const t = angleDiff > 0 ? (currentAzimuth - lowerAngle) / angleDiff : 0;
    
    return { lowerIndex, upperIndex, interpolationFactor: t };
  };

  // 現在の視点に基づいて可視点を計算
  const getVisiblePoints = (azimuthAngle, elevationAngle) => {
    const { points, colors } = generateScene;
    const visiblePoints = [];
    const visibleColors = [];
    
    const azimuthRad = (azimuthAngle * Math.PI) / 180;
    const elevationRad = (elevationAngle * Math.PI) / 180;
    
    const cameraDir = [
      Math.cos(azimuthRad) * Math.cos(elevationRad),
      Math.sin(azimuthRad) * Math.cos(elevationRad),
      Math.sin(elevationRad)
    ];
    
    points.forEach((point, i) => {
      const [x, y, z] = point;
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      if (distance < 25) {
        const pointDir = [x / distance, y / distance, z / distance];
        const dot = cameraDir[0] * pointDir[0] + cameraDir[1] * pointDir[1] + cameraDir[2] * pointDir[2];
        
        if (dot > -0.5) {
          visiblePoints.push(point);
          visibleColors.push(colors[i]);
        }
      }
    });
    
    return { visiblePoints, visibleColors };
  };

  // 3Dポイントを2D画面座標に投影
  const projectTo2D = (points, colors) => {
    const projected = [];
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    points.forEach((point, i) => {
      const [x, y, z] = point;
      
      const rotatedX = x * Math.cos(azimuthRad) + y * Math.sin(azimuthRad);
      const rotatedY = -x * Math.sin(azimuthRad) + y * Math.cos(azimuthRad);
      
      const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY + z * z);
      const scale = 300 / (distance + 5);
      
      const screenX = 400 + rotatedY * scale;
      const screenY = 300 - z * scale;
      const size = Math.max(1, scale * 2);
      
      projected.push({
        x: screenX,
        y: screenY,
        size: size,
        color: colors[i],
        distance: distance
      });
    });
    
    return projected.sort((a, b) => b.distance - a.distance);
  };

  const { visiblePoints, visibleColors } = getVisiblePoints(azimuth, elevation);
  const interpolationInfo = interpolateFromImages(azimuth);
  const projectedPoints = projectTo2D(visiblePoints, visibleColors);

  // 現在の基準画像インデックスを更新
  useEffect(() => {
    setCurrentImageIndex(interpolationInfo.lowerIndex);
  }, [interpolationInfo.lowerIndex]);

  // 自動回転
  useEffect(() => {
    let interval;
    if (isAutoRotating) {
      interval = setInterval(() => {
        setAzimuth(prev => (prev + 2) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const sliderStyle = {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#e5e7eb',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        {/* ヘッダー */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
            8枚画像からの360度Gaussian Splatting
          </h1>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '8px', margin: 0 }}>
            45度間隔の8枚の画像から滑らかな360度ビューを生成（シミュレーション）
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {/* メイン3Dビュー */}
          <div style={{ 
            position: 'relative', 
            background: 'linear-gradient(to bottom, #bfdbfe, #bbf7d0)', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            marginBottom: '24px',
            height: '600px'
          }}>
            <svg width="800" height="600" style={{ width: '100%', height: '100%' }}>
              {projectedPoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r={point.size}
                  fill={`rgb(${Math.floor(point.color[0] * 255)}, ${Math.floor(point.color[1] * 255)}, ${Math.floor(point.color[2] * 255)})`}
                  opacity={Math.min(1, 2 / point.distance)}
                />
              ))}
            </svg>
            
            {/* 情報パネル */}
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              left: '16px', 
              background: 'rgba(0,0,0,0.7)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <div>方位角: {azimuth.toFixed(1)}°</div>
              <div>仰角: {elevation.toFixed(1)}°</div>
              <div>基準画像: {imageLabels[currentImageIndex]} ({imageAngles[currentImageIndex]}°)</div>
              <div>補間係数: {interpolationInfo.interpolationFactor.toFixed(2)}</div>
            </div>
          </div>

          {/* コントロールパネル */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  方位角: {azimuth}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={azimuth}
                  onChange={(e) => setAzimuth(Number(e.target.value))}
                  style={sliderStyle}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  仰角: {elevation}°
                </label>
                <input
                  type="range"
                  min="-30"
                  max="60"
                  step="5"
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  style={sliderStyle}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: isAutoRotating ? '#ef4444' : '#3b82f6',
                    color: 'white'
                  }}
                >
                  {isAutoRotating ? '⏸️ 停止' : '▶️ 自動回転'}
                </button>
                
                <button
                  onClick={() => {
                    setAzimuth(0);
                    setElevation(10);
                    setIsAutoRotating(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    backgroundColor: '#6b7280',
                    color: 'white'
                  }}
                >
                  🔄 リセット
                </button>
              </div>
            </div>

            {/* 8枚の画像位置表示 */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>8枚の基準画像位置</h3>
              <div style={{ 
                position: 'relative', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '8px', 
                padding: '16px', 
                height: '200px'
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '128px', height: '128px', border: '2px solid #d1d5db', borderRadius: '50%' }}>
                    {imageAngles.map((angle, i) => {
                      const radian = (angle * Math.PI) / 180;
                      const x = Math.cos(radian - Math.PI/2) * 50;
                      const y = Math.sin(radian - Math.PI/2) * 50;
                      const isCurrent = i === currentImageIndex;
                      
                      return (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? '#ef4444' : '#3b82f6',
                            transform: 'translate(-50%, -50%)',
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            ...(isCurrent && { transform: 'translate(-50%, -50%) scale(1.5)' })
                          }}
                          title={`${imageLabels[i]} (${angle}°)`}
                        />
                      );
                    })}
                    
                    {/* 現在の視点方向 */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '4px',
                        height: '32px',
                        backgroundColor: '#10b981',
                        left: '50%',
                        top: '50%',
                        transformOrigin: 'bottom center',
                        transform: `translate(-50%, -100%) rotate(${azimuth}deg)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 説明 */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: '500', marginBottom: '8px' }}>Gaussian Splattingの特徴：</h3>
            <ul style={{ fontSize: '14px', color: '#374151', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '4px' }}>• <strong>滑らかな補間：</strong> 8枚の画像間で連続的な視点変化が可能</li>
              <li style={{ marginBottom: '4px' }}>• <strong>3D空間認識：</strong> 奥行き情報を保持して自然な立体感を再現</li>
              <li style={{ marginBottom: '4px' }}>• <strong>リアルタイム処理：</strong> 動的な視点変更にも対応</li>
              <li>• <strong>色彩の凡例：</strong> 緑（地面）、グレー（建物）、緑系（植物）、赤（車両）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaussianSplatting8Images;

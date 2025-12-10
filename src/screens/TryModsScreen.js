// src/screens/TryModsScreen.js
// Smart 2D Part Positioning System with Zone Calibration

import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCarContext } from "../services/carContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAR_VIEW_HEIGHT = 400; // Increased from 280 for larger view

// Default zones - can be calibrated per car
const DEFAULT_ZONES = {
  side: {
    wheel_front: { x: 20, y: 75, width: 18, height: 18, label: "Front Wheel" },
    wheel_rear: { x: 70, y: 75, width: 18, height: 18, label: "Rear Wheel" },
    side_skirt: { x: 25, y: 70, width: 50, height: 10, label: "Side Skirt" },
    door: { x: 32, y: 40, width: 36, height: 30, label: "Door" },
    mirror: { x: 22, y: 42, width: 6, height: 6, label: "Mirror" },
    window_tint: { x: 35, y: 28, width: 30, height: 18, label: "Window" },
  },
  front_quarter: {
    wheel_front: { x: 18, y: 75, width: 20, height: 20, label: "Front Wheel" },
    wheel_rear: { x: 65, y: 75, width: 18, height: 18, label: "Rear Wheel" },
    front_bumper: { x: 8, y: 70, width: 25, height: 18, label: "Front Bumper" },
    front_lip: { x: 8, y: 82, width: 24, height: 6, label: "Front Lip" },
    hood: { x: 18, y: 45, width: 32, height: 22, label: "Hood" },
    headlights: { x: 10, y: 58, width: 12, height: 10, label: "Headlights" },
    grille: { x: 12, y: 65, width: 16, height: 8, label: "Grille" },
    spoiler: { x: 72, y: 35, width: 22, height: 8, label: "Spoiler" },
  },
  rear: {
    wheel_rear_left: { x: 18, y: 75, width: 18, height: 18, label: "Left Wheel" },
    wheel_rear_right: { x: 64, y: 75, width: 18, height: 18, label: "Right Wheel" },
    spoiler: { x: 22, y: 25, width: 56, height: 10, label: "Spoiler" },
    rear_bumper: { x: 18, y: 78, width: 64, height: 12, label: "Rear Bumper" },
    diffuser: { x: 28, y: 86, width: 44, height: 8, label: "Diffuser" },
    exhaust_left: { x: 22, y: 90, width: 10, height: 6, label: "Left Exhaust" },
    exhaust_right: { x: 68, y: 90, width: 10, height: 6, label: "Right Exhaust" },
    taillights: { x: 18, y: 58, width: 64, height: 12, label: "Taillights" },
    trunk: { x: 28, y: 40, width: 44, height: 18, label: "Trunk" },
  },
};

// Parts catalog
const PARTS_CATALOG = {
  wheels: [
    { id: "w1", name: "BBS RS-GT 19\"", brand: "BBS", price: 3200, zones: ["wheel_front", "wheel_rear", "wheel_rear_left", "wheel_rear_right"], color: "#2a2a2a" },
    { id: "w2", name: "Volk TE37 18\"", brand: "Rays", price: 4500, zones: ["wheel_front", "wheel_rear", "wheel_rear_left", "wheel_rear_right"], color: "#1a1a1a" },
    { id: "w3", name: "Enkei RPF1 17\"", brand: "Enkei", price: 1800, zones: ["wheel_front", "wheel_rear", "wheel_rear_left", "wheel_rear_right"], color: "#333" },
  ],
  spoilers: [
    { id: "s1", name: "APR GTC-300 Wing", brand: "APR", price: 1800, zones: ["spoiler"], color: "#111" },
    { id: "s2", name: "Seibon Carbon Lip", brand: "Seibon", price: 650, zones: ["spoiler"], color: "#1a1a1a" },
  ],
  front_lips: [
    { id: "fl1", name: "Vorsteiner Front Lip", brand: "Vorsteiner", price: 1200, zones: ["front_lip", "front_bumper"], color: "#111" },
  ],
  exhausts: [
    { id: "e1", name: "Akrapovic Titanium", brand: "Akrapovic", price: 4800, zones: ["exhaust_left", "exhaust_right"], color: "#4a4a4a" },
  ],
  side_skirts: [
    { id: "ss1", name: "M Performance Side Skirts", brand: "BMW", price: 1100, zones: ["side_skirt"], color: "#111" },
  ],
  diffusers: [
    { id: "d1", name: "Carbon Rear Diffuser", brand: "Vorsteiner", price: 1800, zones: ["diffuser", "rear_bumper"], color: "#111" },
  ],
  hoods: [
    { id: "h1", name: "Vented Carbon Hood", brand: "Seibon", price: 2800, zones: ["hood"], color: "#1a1a1a" },
  ],
  lights: [
    { id: "l1", name: "Morimoto XB LED", brand: "Morimoto", price: 1800, zones: ["headlights", "taillights"], color: "#fff" },
  ],
};

const PART_CATEGORIES = [
  { id: "wheels", name: "Wheels", icon: "disc-outline" },
  { id: "spoilers", name: "Spoilers", icon: "car-sport-outline" },
  { id: "front_lips", name: "Front", icon: "arrow-forward-outline" },
  { id: "exhausts", name: "Exhaust", icon: "flash-outline" },
  { id: "side_skirts", name: "Sides", icon: "remove-outline" },
  { id: "diffusers", name: "Rear", icon: "arrow-back-outline" },
  { id: "hoods", name: "Hood", icon: "square-outline" },
  { id: "lights", name: "Lights", icon: "bulb-outline" },
];

const CAR_VIEWS = [
  { id: "front_quarter", name: "3/4 Front", icon: "arrow-up-right-outline" },
  { id: "side", name: "Side", icon: "arrow-forward-outline" },
  { id: "rear", name: "Rear", icon: "arrow-down-outline" },
];

export default function TryModsScreen({ navigation }) {
  const { activeCar } = useCarContext();
  
  const [carView, setCarView] = useState("front_quarter");
  const [selectedCategory, setSelectedCategory] = useState("wheels");
  const [installedParts, setInstalledParts] = useState({});
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibratingZone, setCalibratingZone] = useState(null);
  const [customZones, setCustomZones] = useState({});
  const [showZones, setShowZones] = useState(false);
  const [customPartImage, setCustomPartImage] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [totalCost, setTotalCost] = useState(0);

  // Get zones (custom or default)
  const getZones = () => {
    const viewZones = customZones[carView] || DEFAULT_ZONES[carView] || DEFAULT_ZONES.front_quarter;
    return viewZones;
  };

  const currentZones = getZones();
  const currentParts = PARTS_CATALOG[selectedCategory] || [];

  useEffect(() => {
    let cost = 0;
    Object.values(installedParts).forEach(part => {
      if (part) cost += part.price || 0;
    });
    setTotalCost(cost);
  }, [installedParts]);

  const handleSelectPart = (part) => {
    const newInstalled = { ...installedParts };
    part.zones.forEach(zone => {
      if (currentZones[zone]) {
        newInstalled[zone] = { 
          ...part, 
          customImage: customPartImage,
          zoneId: zone,
        };
      }
    });
    setInstalledParts(newInstalled);
    setShowPartPicker(false);
    setCustomPartImage(null);
    setShowZones(false);
  };

  const handleRemovePart = (zone) => {
    const newInstalled = { ...installedParts };
    delete newInstalled[zone];
    setInstalledParts(newInstalled);
  };

  const handleUploadCustomPart = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setCustomPartImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const [zonePan, setZonePan] = useState({ x: 0, y: 0 });
  const [zoneScale, setZoneScale] = useState(1);
  const zoneStartPos = useRef({ x: 0, y: 0 });
  
  const zonePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Store starting position
        zoneStartPos.current = { x: zonePan.x, y: zonePan.y };
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new position based on drag
        const carWidth = SCREEN_WIDTH - 64; // Account for margins
        const carHeight = 200; // Calibration car height
        const dxPercent = (gestureState.dx / carWidth) * 100;
        const dyPercent = (gestureState.dy / carHeight) * 100;
        
        const newX = Math.max(0, Math.min(100 - (calibratingZone?.width || 0) * zoneScale, zoneStartPos.current.x + dxPercent));
        const newY = Math.max(0, Math.min(100 - (calibratingZone?.height || 0) * zoneScale, zoneStartPos.current.y + dyPercent));
        
        setZonePan({ x: newX, y: newY });
      },
      onPanResponderRelease: () => {
        // Position is saved in state
      },
    })
  ).current;

  const handleCalibrateZone = (zoneId, zone) => {
    const zoneToCalibrate = { id: zoneId, ...zone };
    setCalibratingZone(zoneToCalibrate);
    setCalibrationMode(true);
    setZonePan({ x: zone.x, y: zone.y });
    setZoneScale(1);
    zoneStartPos.current = { x: zone.x, y: zone.y };
  };

  const handleSaveCalibration = () => {
    if (!calibratingZone) return;
    
    const newZone = {
      ...calibratingZone,
      x: Math.max(0, Math.min(100 - calibratingZone.width, zonePan.x)),
      y: Math.max(0, Math.min(100 - calibratingZone.height, zonePan.y)),
      width: calibratingZone.width * zoneScale,
      height: calibratingZone.height * zoneScale,
    };
    
    const viewZones = { ...(customZones[carView] || DEFAULT_ZONES[carView]) };
    viewZones[calibratingZone.id] = newZone;
    setCustomZones({ ...customZones, [carView]: viewZones });
    setCalibrationMode(false);
    setCalibratingZone(null);
    Alert.alert("Saved", "Zone position updated!");
  };

  // Render zone calibration with draggable zone
  const renderZoneCalibration = () => {
    if (!calibrationMode || !calibratingZone) return null;

    const carImageUri = getCarImageUri();

    return (
      <Modal visible={calibrationMode} transparent animationType="fade">
        <View style={styles.calibrationBackdrop}>
          <View style={styles.calibrationContainer}>
            <Text style={styles.calibrationTitle}>Calibrate: {calibratingZone.label}</Text>
            <Text style={styles.calibrationHint}>
              Drag the zone to match your car's part location
            </Text>
            
            {/* Car Preview with Draggable Zone */}
            <View style={styles.calibrationCarContainer}>
              {carImageUri ? (
                <>
                  <Image source={{ uri: carImageUri }} style={styles.calibrationCarImage} />
                  <Animated.View
                    style={[
                      styles.calibrationZone,
                      {
                        left: `${zonePan.x}%`,
                        top: `${zonePan.y}%`,
                        width: `${calibratingZone.width * zoneScale}%`,
                        height: `${calibratingZone.height * zoneScale}%`,
                      },
                    ]}
                    {...zonePanResponder.panHandlers}
                  >
                    <View style={styles.calibrationZoneInner}>
                      <Text style={styles.calibrationZoneLabel}>{calibratingZone.label}</Text>
                    </View>
                  </Animated.View>
                </>
              ) : (
                <View style={styles.calibrationPlaceholder}>
                  <Text style={styles.calibrationPlaceholderText}>No car image</Text>
                </View>
              )}
            </View>

            {/* Size Controls */}
            <View style={styles.calibrationControls}>
              <Text style={styles.calibrationControlLabel}>Size</Text>
              <View style={styles.calibrationSizeButtons}>
                <TouchableOpacity 
                  style={styles.calibrationSizeBtn}
                  onPress={() => setZoneScale(Math.max(0.5, zoneScale - 0.1))}
                >
                  <Text style={styles.calibrationSizeBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.calibrationSizeValue}>{Math.round(zoneScale * 100)}%</Text>
                <TouchableOpacity 
                  style={styles.calibrationSizeBtn}
                  onPress={() => setZoneScale(Math.min(2, zoneScale + 0.1))}
                >
                  <Text style={styles.calibrationSizeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.calibrationButtons}>
              <TouchableOpacity 
                style={styles.calibrationCancel}
                onPress={() => {
                  setCalibrationMode(false);
                  setCalibratingZone(null);
                }}
              >
                <Text style={styles.calibrationCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.calibrationSave}
                onPress={handleSaveCalibration}
              >
                <Text style={styles.calibrationSaveText}>Save Position</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render empty zone
  const renderEmptyZone = (zoneId, zone) => {
    return (
      <TouchableOpacity
        key={zoneId}
        style={[
          styles.partZone,
          {
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          },
        ]}
        onPress={() => {
          if (calibrationMode) {
            handleCalibrateZone(zoneId, zone);
          } else {
            setSelectedZone(zoneId);
            setShowPartPicker(true);
          }
        }}
        onLongPress={() => handleCalibrateZone(zoneId, zone)}
      >
        <View style={styles.emptyZone}>
          <View style={styles.emptyZoneInner}>
            <Text style={styles.emptyZoneIcon}>+</Text>
          </View>
        </View>
        <View style={styles.zoneLabel}>
          <Text style={styles.zoneLabelText}>{zone.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render installed part on car
  const renderInstalledPart = (zoneId, part) => {
    const zone = currentZones[zoneId];
    if (!zone) return null;

    return (
      <View
        key={zoneId}
        style={[
          styles.installedPartAbsolute,
          {
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          },
        ]}
      >
        {part.customImage ? (
          <View style={styles.customPartContainer}>
            <Image 
              source={{ uri: part.customImage }} 
              style={styles.customPartImage}
              resizeMode="cover"
            />
            <View style={styles.partOverlay} />
            <View style={styles.partShadow} />
          </View>
        ) : (
          <View style={[styles.installedPartVisual, { backgroundColor: part.color || "#1a1a1a" }]}>
            <View style={styles.partInnerGlow} />
            <View style={styles.partBorder} />
            {/* For wheels, show a circular representation */}
            {zoneId.includes("wheel") ? (
              <View style={styles.wheelVisual}>
                <View style={styles.wheelSpokes} />
                <View style={styles.wheelRim} />
              </View>
            ) : (
              <Ionicons name="checkmark" size={18} color="#22c55e" />
            )}
          </View>
        )}
        {/* Tap to remove */}
        <TouchableOpacity
          style={styles.removePartButton}
          onPress={() => {
            Alert.alert(
              part.name,
              `Remove ${part.name}?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => handleRemovePart(zoneId) },
              ]
            );
          }}
        >
          <Ionicons name="close" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Get car image URI - prefer renderingPreviewUrl, then anglePhotos, then imageUrl
  const getCarImageUri = () => {
    // First, try rendering preview
    if (activeCar?.renderingPreviewUrl) {
      return activeCar.renderingPreviewUrl;
    }
    
    // Then try anglePhotos based on view
    if (activeCar?.anglePhotos) {
      if (carView === "front_quarter" && activeCar.anglePhotos.front34) return activeCar.anglePhotos.front34;
      if (carView === "side" && activeCar.anglePhotos.side) return activeCar.anglePhotos.side;
      if (carView === "rear" && activeCar.anglePhotos.rear) return activeCar.anglePhotos.rear;
      if (carView === "front_quarter" && activeCar.anglePhotos.front) return activeCar.anglePhotos.front;
      if (carView === "rear" && activeCar.anglePhotos.rear34) return activeCar.anglePhotos.rear34;
    }
    
    // Fallback to legacy images
    if (activeCar?.images) {
      if (carView === "front_quarter" && activeCar.images.front) return activeCar.images.front;
      if (carView === "side" && activeCar.images.side) return activeCar.images.side;
      if (carView === "rear" && activeCar.images.rear) return activeCar.images.rear;
    }
    
    // Final fallback to main image
    return activeCar?.imageUrl;
  };

  const carImageUri = getCarImageUri();

  // Part Picker Modal
  const renderPartPicker = () => (
    <Modal visible={showPartPicker} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Part</Text>
            <TouchableOpacity onPress={() => setShowPartPicker(false)}>
              <Ionicons name="close" size={24} color="#a0a0a0" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {PART_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={16} 
                  color={selectedCategory === cat.id ? "#ffffff" : "#666"} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.categoryTabText, selectedCategory === cat.id && styles.categoryTabTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.customUploadRow} onPress={handleUploadCustomPart}>
            <Ionicons name="camera-outline" size={24} color="#4a9eff" style={{ marginRight: 12 }} />
            <View style={styles.customUploadText}>
              <Text style={styles.customUploadTitle}>Upload Your Own Part Image</Text>
              <Text style={styles.customUploadSubtitle}>Use a photo of the actual part</Text>
            </View>
            {customPartImage && (
              <Image source={{ uri: customPartImage }} style={styles.customUploadPreview} />
            )}
          </TouchableOpacity>

          <ScrollView style={styles.partsList}>
            {currentParts.map((part) => (
              <TouchableOpacity
                key={part.id}
                style={styles.partItem}
                onPress={() => handleSelectPart(part)}
              >
                <View style={[styles.partItemColor, { backgroundColor: part.color }]} />
                <View style={styles.partItemInfo}>
                  <Text style={styles.partItemBrand}>{part.brand}</Text>
                  <Text style={styles.partItemName}>{part.name}</Text>
                </View>
                <Text style={styles.partItemPrice}>${part.price.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Part Visualizer</Text>
        <TouchableOpacity 
          onPress={() => setCalibrationMode(!calibrationMode)}
          style={styles.calibrateButton}
        >
          {calibrationMode ? (
            <Ionicons name="checkmark" size={20} color="#22c55e" />
          ) : (
            <Ionicons name="settings-outline" size={20} color="#4a9eff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* View Selector */}
        <View style={styles.viewSelector}>
          {CAR_VIEWS.map((view) => (
            <TouchableOpacity
              key={view.id}
              style={[styles.viewTab, carView === view.id && styles.viewTabActive]}
              onPress={() => setCarView(view.id)}
            >
              <Ionicons 
                name={view.icon} 
                size={16} 
                color={carView === view.id ? "#ffffff" : "#666"} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.viewTabText, carView === view.id && styles.viewTabTextActive]}>
                {view.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Car Display */}
        <View style={styles.carContainer}>
          {carImageUri ? (
            <>
              <Image source={{ uri: carImageUri }} style={styles.carImage} />
              
              {/* Installed Parts Overlay - Always visible */}
              <View style={styles.installedPartsOverlay}>
                {Object.entries(installedParts).map(([zoneId, part]) => 
                  renderInstalledPart(zoneId, part)
                )}
              </View>

              {/* Empty Zones - Only show when adding */}
              {showZones && (
                <View style={styles.zonesOverlay}>
                  {Object.entries(currentZones).map(([zoneId, zone]) => {
                    if (installedParts[zoneId]) return null;
                    return renderEmptyZone(zoneId, zone);
                  })}
                </View>
              )}

              {/* Calibration Mode Indicator */}
              {calibrationMode && (
                <View style={styles.calibrationIndicator}>
                  <Ionicons name="construct-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.calibrationIndicatorText}>
                    Calibration Mode: Long press zones to adjust
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.carPlaceholder}>
              <Ionicons name="car-outline" size={48} color="#666" style={{ marginBottom: 12 }} />
              <Text style={styles.carPlaceholderText}>
                {activeCar ? `${activeCar.year} ${activeCar.make} ${activeCar.model}` : "Add a car first"}
              </Text>
              <TouchableOpacity 
                style={styles.addCarButton}
                onPress={() => navigation.navigate("AddCar")}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.addCarButtonText}>Add Car Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions - Only show in calibration mode */}
        {calibrationMode && (
          <View style={styles.instructions}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#4a9eff" style={{ marginRight: 8 }} />
              <Text style={styles.instructionsText}>
                Long press zones to adjust their position
              </Text>
            </View>
          </View>
        )}

        {/* Quick Add */}
        <View style={styles.quickCategories}>
          <Text style={styles.sectionTitle}>Quick Add Parts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PART_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.quickCategoryCard}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setShowZones(true);
                  setShowPartPicker(true);
                }}
              >
                <Ionicons name={cat.icon} size={24} color="#4a9eff" style={{ marginBottom: 8 }} />
                <Text style={styles.quickCategoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Installed Parts Summary */}
        {Object.keys(installedParts).length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Installed Parts</Text>
            <View style={styles.installedList}>
              {Object.entries(installedParts).map(([zone, part]) => (
                <View key={zone} style={styles.installedItem}>
                  <View style={[styles.installedItemDot, { backgroundColor: part.color }]} />
                  <View style={styles.installedItemInfo}>
                    <Text style={styles.installedItemName}>{part.name}</Text>
                    <Text style={styles.installedItemZone}>{currentZones[zone]?.label || zone}</Text>
                  </View>
                  <Text style={styles.installedItemPrice}>${part.price.toLocaleString()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalCost}>
              <Text style={styles.totalCostLabel}>Total Build Cost</Text>
              <Text style={styles.totalCostValue}>${totalCost.toLocaleString()}</Text>
            </View>
          </View>
        )}


        <View style={{ height: 100 }} />
      </ScrollView>

      {renderPartPicker()}
      {renderZoneCalibration()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: { width: 60 },
  backButtonText: { color: "#4a9eff", fontSize: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  calibrateButton: { width: 60, alignItems: "flex-end" },
  
  viewSelector: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewTabActive: { backgroundColor: "#1a1a1a" },
  viewTabText: { color: "#888", fontSize: 13 },
  viewTabTextActive: { color: "#fff", fontWeight: "600" },

  carContainer: {
    height: CAR_VIEW_HEIGHT,
    marginHorizontal: 16,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  carImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  carPlaceholderText: { color: "#888", fontSize: 16, marginBottom: 16 },
  addCarButton: {
    backgroundColor: "#4a9eff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addCarButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  zonesOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "box-none",
  },
  installedPartsOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "box-none",
  },
  installedPartAbsolute: {
    position: "absolute",
  },
  partZone: {
    position: "absolute",
  },
  emptyZone: {
    width: "100%",
    height: "100%",
    borderWidth: 1.5,
    borderColor: "rgba(74, 158, 255, 0.3)",
    borderStyle: "dashed",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(74, 158, 255, 0.08)",
  },
  emptyZoneInner: {
    width: "70%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(74, 158, 255, 0.15)",
    borderRadius: 4,
  },
  emptyZoneIcon: {
    color: "#4a9eff",
    fontSize: 18,
    fontWeight: "bold",
  },
  zoneLabel: {
    position: "absolute",
    bottom: -18,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  zoneLabelText: {
    color: "#888",
    fontSize: 9,
  },
  
  installedPartVisual: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#22c55e",
    position: "relative",
    overflow: "hidden",
    // Better blending
    opacity: 0.9,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  partInnerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  partBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  installedPartIcon: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "bold",
    zIndex: 1,
  },
  wheelVisual: {
    width: "90%",
    height: "90%",
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  wheelSpokes: {
    width: "70%",
    height: "70%",
    borderWidth: 3,
    borderColor: "#2a2a2a",
    borderRadius: 50,
    // Spoke pattern
    borderStyle: "dashed",
  },
  wheelRim: {
    width: "50%",
    height: "50%",
    backgroundColor: "#1a1a1a",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#333",
    // Center cap
    justifyContent: "center",
    alignItems: "center",
  },
  customPartContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    // Better blending with car
    opacity: 0.95,
  },
  customPartImage: {
    width: "100%",
    height: "100%",
    // Better image rendering
    resizeMode: "cover",
  },
  partOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // More realistic blending - darker at edges
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    // Gradient effect
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  partShadow: {
    position: "absolute",
    bottom: -4,
    left: "5%",
    right: "5%",
    height: 8,
    // More realistic shadow
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 4,
    opacity: 0.8,
    // Blur effect simulation
    transform: [{ scaleY: 0.5 }],
  },
  removePartButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  calibrationIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(74, 158, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  calibrationIndicatorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  
  instructions: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionsText: { color: "#888", fontSize: 13, marginBottom: 8 },
  toggleZonesButton: {
    backgroundColor: "#4a9eff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleZonesButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  
  quickCategories: {
    marginTop: 24,
    paddingLeft: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  quickCategoryCard: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 14,
    marginRight: 10,
    width: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  quickCategoryName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  
  summarySection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  installedList: {},
  installedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  installedItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  installedItemInfo: { flex: 1 },
  installedItemName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  installedItemZone: { color: "#666", fontSize: 11, marginTop: 2 },
  installedItemPrice: { color: "#22c55e", fontSize: 14, fontWeight: "600" },
  totalCost: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalCostLabel: { color: "#888", fontSize: 14 },
  totalCostValue: { color: "#22c55e", fontSize: 24, fontWeight: "800" },
  
  mlInfo: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4a9eff30",
  },
  mlInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mlInfoTitle: {
    color: "#4a9eff",
    fontSize: 16,
    fontWeight: "700",
  },
  mlInfoText: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
  },
  
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  categoryTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#222",
  },
  categoryTabActive: { backgroundColor: "#4a9eff" },
  categoryTabText: { color: "#888", fontSize: 13 },
  categoryTabTextActive: { color: "#fff", fontWeight: "600" },
  customUploadRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  customUploadText: { flex: 1 },
  customUploadTitle: { color: "#fff", fontSize: 14, fontWeight: "500" },
  customUploadSubtitle: { color: "#666", fontSize: 12, marginTop: 2 },
  customUploadPreview: { width: 40, height: 40, borderRadius: 8 },
  partsList: {
    padding: 16,
  },
  partItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  partItemColor: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  partItemInfo: { flex: 1 },
  partItemBrand: { color: "#4a9eff", fontSize: 11, fontWeight: "600" },
  partItemName: { color: "#fff", fontSize: 15, fontWeight: "500", marginTop: 2 },
  partItemPrice: { color: "#22c55e", fontSize: 16, fontWeight: "700" },
  
  // Calibration
  calibrationBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  calibrationContainer: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  calibrationTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  calibrationHint: {
    color: "#888",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  calibrationCarContainer: {
    height: 200,
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  calibrationCarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  calibrationPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  calibrationPlaceholderText: {
    color: "#666",
    fontSize: 14,
  },
  calibrationZone: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#4a9eff",
    borderRadius: 8,
    backgroundColor: "rgba(74, 158, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  calibrationZoneInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  calibrationZoneLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calibrationControls: {
    marginBottom: 16,
  },
  calibrationControlLabel: {
    color: "#888",
    fontSize: 13,
    marginBottom: 8,
  },
  calibrationSizeButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  calibrationSizeBtn: {
    backgroundColor: "#222",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  calibrationSizeBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
  calibrationSizeValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
  calibrationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  calibrationCancel: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  calibrationCancelText: {
    color: "#fff",
    fontSize: 15,
  },
  calibrationSave: {
    flex: 1,
    backgroundColor: "#4a9eff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  calibrationSaveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

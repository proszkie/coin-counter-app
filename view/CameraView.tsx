import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";

const CameraView = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const type = Camera.Constants.Type.back;
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={styles.container}>
      <Camera ref={(ref) => setCamera(ref)} style={styles.camera} type={type}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={isWaiting ? [styles.button, styles.overlay] : styles.button}
            onPress={async () => {
              if (isWaiting) {
                return;
              }
              setIsWaiting(true);
              let photo = await camera?.takePictureAsync({ base64: true });
              let response = await fetch("http://192.168.43.158:8080/", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "text/plain",
                },
                body: photo?.base64,
              });
              let data = (await response.json()) as ApiResponse;
              setIsWaiting(false);
              console.log("There is " + data.amount + " " + data.denomination);
            }}
          >
            <ActivityIndicator
              style={styles.spinner}
              animating={isWaiting}
              color="#0000ff"
              size={100}
            />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

type ApiResponse = {
  amount: number;
  denomination: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    backgroundColor: "transparent",
    flexDirection: "row",
    flex: 1
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 200
  },
  spinner: {},
  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.5)"
  },
});

export default CameraView;

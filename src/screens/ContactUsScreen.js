// src/screens/ContactUsScreen.js

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCarContext } from "../services/carContext";

const CONTACT_OPTIONS = [
  {
    id: "email",
    icon: "📧",
    title: "Email Us",
    subtitle: "support@thatcarguy.app",
    action: () => Linking.openURL("mailto:support@thatcarguy.app"),
  },
  {
    id: "twitter",
    icon: "🐦",
    title: "Twitter / X",
    subtitle: "@ThatCarGuyApp",
    action: () => Linking.openURL("https://twitter.com/ThatCarGuyApp"),
  },
  {
    id: "instagram",
    icon: "📸",
    title: "Instagram",
    subtitle: "@ThatCarGuyApp",
    action: () => Linking.openURL("https://instagram.com/ThatCarGuyApp"),
  },
];

export default function ContactUsScreen({ navigation }) {
  const { user } = useCarContext();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing Info", "Please fill in both subject and message.");
      return;
    }

    setSending(true);
    
    // Simulate sending (in production, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSending(false);
    Alert.alert(
      "Message Sent!",
      "Thanks for reaching out. We'll get back to you within 24-48 hours.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>We'd love to hear from you!</Text>
          <Text style={styles.introText}>
            Have a question, feedback, or need help? Reach out and we'll get back to you as soon as possible.
          </Text>
        </View>

        {/* Contact Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          {CONTACT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.action}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Text style={styles.optionChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Send a Message</Text>
          
          <View style={styles.formCard}>
            <Text style={styles.label}>Your Email</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledInputText}>
                {user?.email || "Not signed in"}
              </Text>
            </View>

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this about?"
              placeholderTextColor="#666"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us more..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, sending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Response Time */}
        <View style={styles.responseInfo}>
          <Text style={styles.responseIcon}>⏱️</Text>
          <Text style={styles.responseText}>
            Average response time: 24-48 hours
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  introSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  introTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  introText: {
    color: "#888",
    fontSize: 16,
    lineHeight: 24,
  },
  optionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionSubtitle: {
    color: "#4a9eff",
    fontSize: 14,
  },
  optionChevron: {
    color: "#666",
    fontSize: 20,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: "#181818",
    padding: 16,
    borderRadius: 16,
  },
  label: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabledInputText: {
    color: "#666",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#4a9eff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  responseInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  responseIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  responseText: {
    color: "#666",
    fontSize: 14,
  },
});



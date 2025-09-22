import logging
from typing import Dict, List, Any
import re
from datetime import datetime
import numpy as np
import json

# Safe imports with fallbacks - moved to lazy loading
HAS_TRANSFORMERS = False
HAS_SENTENCE_TRANSFORMERS = False
HAS_SPACY = False
HAS_TEXTBLOB = False

try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False
    logging.warning("TextBlob not available")

logger = logging.getLogger(__name__)

class GrievanceAnalyzer:
    def __init__(self):
        """Initialize the grievance analyzer with AI models"""
        self.models_loaded = False
        self.load_models()
    
    def load_models(self):
        """Load all required AI models for grievance analysis with fallbacks"""
        try:
            logger.info("Loading AI models for grievance analysis...")
            
            # Try to load sentiment analysis model
            try:
                import torch
                from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
                global HAS_TRANSFORMERS
                HAS_TRANSFORMERS = True
                
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    return_all_scores=True
                )
                
                # Load emotion detection model
                self.emotion_analyzer = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    return_all_scores=True
                )
                logger.info("Transformer models loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load transformer models: {e}")
                self.sentiment_analyzer = None
                self.emotion_analyzer = None
                HAS_TRANSFORMERS = False
            
            # Try to load text similarity model
            try:
                from sentence_transformers import SentenceTransformer
                global HAS_SENTENCE_TRANSFORMERS
                HAS_SENTENCE_TRANSFORMERS = True
                self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Sentence transformer loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load sentence transformer: {e}")
                self.similarity_model = None
                HAS_SENTENCE_TRANSFORMERS = False
            
            # Try to load SpaCy model for NER and linguistic analysis
            try:
                import spacy
                global HAS_SPACY
                HAS_SPACY = True
                self.nlp = spacy.load("en_core_web_sm")
                logger.info("SpaCy model loaded successfully")
            except Exception as e:
                logger.warning(f"SpaCy model not available: {e}")
                self.nlp = None
                HAS_SPACY = False
            
            # Predefined categories with example embeddings
            self.grievance_categories = {
                'administrative': [
                    'delayed service', 'bureaucratic delays', 'documentation issues',
                    'official misconduct', 'administrative negligence'
                ],
                'infrastructure': [
                    'road conditions', 'water supply', 'electricity problems',
                    'sewage issues', 'public transport', 'street lighting'
                ],
                'healthcare': [
                    'medical negligence', 'hospital issues', 'doctor unavailability',
                    'medicine shortage', 'healthcare facilities'
                ],
                'education': [
                    'school problems', 'teacher issues', 'educational facilities',
                    'examination problems', 'scholarship issues'
                ],
                'law_enforcement': [
                    'police misconduct', 'security issues', 'crime reporting',
                    'harassment', 'law and order'
                ],
                'financial': [
                    'pension issues', 'banking problems', 'loan difficulties',
                    'financial assistance', 'subsidy problems'
                ],
                'employment': [
                    'job discrimination', 'workplace harassment', 'salary issues',
                    'unemployment benefits', 'labor rights'
                ],
                'environment': [
                    'pollution issues', 'waste management', 'environmental degradation',
                    'noise pollution', 'air quality'
                ],
                'social_welfare': [
                    'welfare scheme issues', 'ration card problems', 'caste discrimination',
                    'social security', 'disability services'
                ],
                'utilities': [
                    'gas supply', 'internet connectivity', 'cable services',
                    'postal services', 'utility billing'
                ]
            }
            
            # Precompute category embeddings
            self.category_embeddings = {}
            for category, examples in self.grievance_categories.items():
                embeddings = self.similarity_model.encode(examples)
                self.category_embeddings[category] = np.mean(embeddings, axis=0)
            
            # Priority keywords
            self.urgency_keywords = {
                'high': [
                    'emergency', 'urgent', 'critical', 'immediate', 'life threatening',
                    'severe', 'crisis', 'danger', 'health risk', 'safety concern'
                ],
                'medium': [
                    'important', 'significant', 'major', 'serious', 'concern',
                    'problem', 'issue', 'difficulty', 'trouble'
                ],
                'low': [
                    'minor', 'small', 'suggestion', 'improvement', 'feedback',
                    'request', 'inquiry', 'question'
                ]
            }
            
            self.models_loaded = True
            logger.info("All grievance analysis models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading grievance models: {str(e)}")
            self.models_loaded = False
    
    def analyze_grievance(self, text: str) -> Dict[str, Any]:
        """Main grievance analysis function"""
        try:
            if not text or not text.strip():
                raise ValueError("Empty text provided")
            
            analysis = {
                'input_text': text,
                'text_stats': self.get_text_statistics(text),
                'sentiment_analysis': self.analyze_sentiment(text),
                'emotion_analysis': self.analyze_emotions(text),
                'category_prediction': self.predict_category(text),
                'urgency_assessment': self.assess_urgency(text),
                'entity_extraction': self.extract_entities(text),
                'language_analysis': self.analyze_language(text),
                'resolution_suggestions': self.suggest_resolution_path(text),
                'processed_at': datetime.now().isoformat()
            }
            
            # Calculate overall priority score
            analysis['priority_score'] = self.calculate_priority_score(analysis)
            
            # Generate summary
            analysis['summary'] = self.generate_summary(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in grievance analysis: {str(e)}")
            raise
    
    def get_text_statistics(self, text: str) -> Dict[str, Any]:
        """Get basic statistics about the text"""
        stats = {
            'character_count': len(text),
            'word_count': len(text.split()),
            'sentence_count': len([s for s in text.split('.') if s.strip()]),
            'avg_word_length': 0,
            'readability_score': 0
        }
        
        words = text.split()
        if words:
            stats['avg_word_length'] = sum(len(word) for word in words) / len(words)
        
        # Simple readability score (Flesch-like)
        if stats['sentence_count'] > 0 and stats['word_count'] > 0:
            avg_sentence_length = stats['word_count'] / stats['sentence_count']
            stats['readability_score'] = max(0, min(100, 
                206.835 - (1.015 * avg_sentence_length) - (84.6 * stats['avg_word_length'])
            ))
        
        return stats
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of the grievance"""
        try:
            # Use transformer-based sentiment analysis if available
            if self.sentiment_analyzer:
                results = self.sentiment_analyzer(text)
                
                sentiment_scores = {}
                primary_sentiment = None
                max_score = 0
                
                for result in results:
                    label = result['label'].lower()
                    score = result['score']
                    sentiment_scores[label] = score
                    
                    if score > max_score:
                        max_score = score
                        primary_sentiment = label
            else:
                # Fallback sentiment analysis
                sentiment_data = self._fallback_sentiment_analysis(text)
                primary_sentiment = sentiment_data['primary_sentiment'].lower()
                max_score = sentiment_data['confidence']
                sentiment_scores = {primary_sentiment: max_score}
            
            # TextBlob analysis as secondary measure if available
            textblob_polarity = 0
            textblob_subjectivity = 0
            if HAS_TEXTBLOB:
                try:
                    blob = TextBlob(text)
                    textblob_polarity = blob.sentiment.polarity
                    textblob_subjectivity = blob.sentiment.subjectivity
                except Exception as e:
                    logger.warning(f"TextBlob analysis failed: {e}")
            
            return {
                'primary_sentiment': primary_sentiment,
                'confidence': max_score,
                'detailed_scores': sentiment_scores,
                'polarity': textblob_polarity,  # -1 (negative) to 1 (positive)
                'subjectivity': textblob_subjectivity,  # 0 (objective) to 1 (subjective)
                'intensity': self.calculate_sentiment_intensity(text)
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {
                'primary_sentiment': 'unknown',
                'confidence': 0.0,
                'detailed_scores': {},
                'polarity': 0.0,
                'subjectivity': 0.0,
                'intensity': 'medium'
            }
    
    def analyze_emotions(self, text: str) -> Dict[str, Any]:
        """Analyze emotions in the grievance"""
        try:
            results = self.emotion_analyzer(text)
            
            emotions = {}
            primary_emotion = None
            max_score = 0
            
            for result in results:
                emotion = result['label'].lower()
                score = result['score']
                emotions[emotion] = score
                
                if score > max_score:
                    max_score = score
                    primary_emotion = emotion
            
            return {
                'primary_emotion': primary_emotion,
                'confidence': max_score,
                'emotion_scores': emotions,
                'emotional_intensity': self.assess_emotional_intensity(emotions)
            }
            
        except Exception as e:
            logger.error(f"Error in emotion analysis: {str(e)}")
            return {
                'primary_emotion': 'unknown',
                'confidence': 0.0,
                'emotion_scores': {},
                'emotional_intensity': 'medium'
            }
    
    def predict_category(self, text: str) -> Dict[str, Any]:
        """Predict the category of the grievance"""
        try:
            text_embedding = self.similarity_model.encode([text])[0]
            
            similarities = {}
            for category, category_embedding in self.category_embeddings.items():
                similarity = np.dot(text_embedding, category_embedding) / (
                    np.linalg.norm(text_embedding) * np.linalg.norm(category_embedding)
                )
                similarities[category] = float(similarity)
            
            # Find best category
            best_category = max(similarities.keys(), key=lambda x: similarities[x])
            confidence = similarities[best_category]
            
            # Sort all categories by similarity
            sorted_categories = sorted(similarities.items(), key=lambda x: x[1], reverse=True)
            
            # Keyword-based enhancement
            keyword_matches = self.find_category_keywords(text)
            
            return {
                'predicted_category': best_category,
                'confidence': confidence,
                'all_scores': similarities,
                'top_categories': sorted_categories[:3],
                'keyword_matches': keyword_matches,
                'category_description': self.get_category_description(best_category)
            }
            
        except Exception as e:
            logger.error(f"Error in category prediction: {str(e)}")
            return {
                'predicted_category': 'general',
                'confidence': 0.0,
                'all_scores': {},
                'top_categories': [],
                'keyword_matches': {},
                'category_description': 'General grievance'
            }
    
    def assess_urgency(self, text: str) -> Dict[str, Any]:
        """Assess the urgency level of the grievance"""
        try:
            text_lower = text.lower()
            urgency_scores = {'high': 0, 'medium': 0, 'low': 0}
            
            # Keyword-based scoring
            for level, keywords in self.urgency_keywords.items():
                for keyword in keywords:
                    count = text_lower.count(keyword)
                    urgency_scores[level] += count
            
            # Determine primary urgency
            total_matches = sum(urgency_scores.values())
            if total_matches == 0:
                urgency_level = 'medium'
                confidence = 0.5
            else:
                urgency_level = max(urgency_scores.keys(), key=lambda x: urgency_scores[x])
                confidence = urgency_scores[urgency_level] / total_matches
            
            # Additional factors
            urgency_factors = []
            
            # Length factor (very long grievances might be more detailed/urgent)
            if len(text.split()) > 100:
                urgency_factors.append('Detailed description provided')
            
            # Sentiment factor
            sentiment = self.analyze_sentiment(text)
            if sentiment.get('primary_sentiment') == 'negative' and sentiment.get('confidence', 0) > 0.8:
                urgency_factors.append('Strong negative sentiment')
            
            # Time-related keywords
            time_urgent_words = ['today', 'now', 'immediately', 'asap', 'right away']
            if any(word in text_lower for word in time_urgent_words):
                urgency_factors.append('Time-sensitive language detected')
                if urgency_level != 'high':
                    urgency_level = 'medium'  # Upgrade if not already high
            
            return {
                'urgency_level': urgency_level,
                'confidence': confidence,
                'urgency_scores': urgency_scores,
                'urgency_factors': urgency_factors,
                'estimated_response_time': self.estimate_response_time(urgency_level)
            }
            
        except Exception as e:
            logger.error(f"Error in urgency assessment: {str(e)}")
            return {
                'urgency_level': 'medium',
                'confidence': 0.5,
                'urgency_scores': {},
                'urgency_factors': [],
                'estimated_response_time': '3-5 days'
            }
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract named entities from the grievance"""
        entities = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'money': [],
            'contact_info': {},
            'custom_entities': {}
        }
        
        try:
            if self.nlp:
                doc = self.nlp(text)
                
                for ent in doc.ents:
                    if ent.label_ == "PERSON":
                        entities['persons'].append(ent.text)
                    elif ent.label_ == "ORG":
                        entities['organizations'].append(ent.text)
                    elif ent.label_ in ["GPE", "LOC"]:
                        entities['locations'].append(ent.text)
                    elif ent.label_ == "DATE":
                        entities['dates'].append(ent.text)
                    elif ent.label_ == "MONEY":
                        entities['money'].append(ent.text)
            
            # Extract contact information using regex
            phone_pattern = r'(?:\+91|91)?[6-9]\d{9}'
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            
            entities['contact_info']['phones'] = re.findall(phone_pattern, text)
            entities['contact_info']['emails'] = re.findall(email_pattern, text)
            
            # Extract reference numbers
            ref_pattern = r'(?:ref|reference|ticket|case|id)[\s:]*([A-Z0-9]{6,})'
            entities['custom_entities']['reference_numbers'] = re.findall(ref_pattern, text, re.IGNORECASE)
            
            # Extract department mentions
            dept_keywords = [
                'police', 'hospital', 'school', 'municipality', 'corporation',
                'district collector', 'collector office', 'tehsil', 'panchayat'
            ]
            mentioned_depts = [dept for dept in dept_keywords if dept in text.lower()]
            entities['custom_entities']['departments'] = mentioned_depts
            
        except Exception as e:
            logger.error(f"Error in entity extraction: {str(e)}")
        
        return entities
    
    def analyze_language(self, text: str) -> Dict[str, Any]:
        """Analyze language characteristics of the grievance"""
        try:
            from langdetect import detect, detect_langs
            
            analysis = {
                'detected_language': 'unknown',
                'confidence': 0.0,
                'formality_level': 'medium',
                'complexity_score': 0.0,
                'emotional_language': False
            }
            
            # Language detection
            try:
                primary_lang = detect(text)
                lang_probs = detect_langs(text)
                analysis['detected_language'] = primary_lang
                analysis['confidence'] = lang_probs[0].prob if lang_probs else 0.0
            except:
                pass
            
            # Formality analysis
            formal_indicators = ['sir', 'madam', 'kindly', 'respectfully', 'hereby']
            informal_indicators = ['hey', 'hi', 'please', 'help', 'really']
            
            formal_count = sum(1 for word in formal_indicators if word in text.lower())
            informal_count = sum(1 for word in informal_indicators if word in text.lower())
            
            if formal_count > informal_count:
                analysis['formality_level'] = 'formal'
            elif informal_count > formal_count:
                analysis['formality_level'] = 'informal'
            
            # Complexity (based on sentence length and vocabulary)
            words = text.split()
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            analysis['complexity_score'] = min(avg_word_length / 10.0, 1.0)
            
            # Emotional language detection
            emotional_words = [
                'angry', 'frustrated', 'disappointed', 'upset', 'worried',
                'concerned', 'desperate', 'helpless', 'ignored', 'neglected'
            ]
            analysis['emotional_language'] = any(word in text.lower() for word in emotional_words)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in language analysis: {str(e)}")
            return {
                'detected_language': 'unknown',
                'confidence': 0.0,
                'formality_level': 'medium',
                'complexity_score': 0.0,
                'emotional_language': False
            }
    
    def suggest_resolution_path(self, text: str) -> Dict[str, Any]:
        """Suggest resolution path based on grievance analysis"""
        try:
            category = self.predict_category(text)
            urgency = self.assess_urgency(text)
            
            # Define resolution paths for different categories
            resolution_paths = {
                'administrative': {
                    'department': 'Administrative Services',
                    'escalation_levels': ['Local Office', 'District Office', 'State Level'],
                    'typical_timeline': '5-10 days',
                    'required_documents': ['Application', 'ID Proof', 'Supporting Documents']
                },
                'infrastructure': {
                    'department': 'Public Works Department',
                    'escalation_levels': ['Local PWD', 'Municipal Corporation', 'State PWD'],
                    'typical_timeline': '10-30 days',
                    'required_documents': ['Complaint Application', 'Location Details', 'Photos']
                },
                'healthcare': {
                    'department': 'Health Department',
                    'escalation_levels': ['Local Health Center', 'District Health Office', 'State Health'],
                    'typical_timeline': '3-7 days',
                    'required_documents': ['Medical Records', 'Complaint Letter', 'ID Proof']
                },
                'law_enforcement': {
                    'department': 'Police Department',
                    'escalation_levels': ['Local Police Station', 'Superintendent of Police', 'DGP Office'],
                    'typical_timeline': '1-5 days',
                    'required_documents': ['FIR/Complaint', 'Evidence', 'Witness Details']
                }
            }
            
            predicted_category = category.get('predicted_category', 'general')
            resolution_info = resolution_paths.get(predicted_category, {
                'department': 'General Grievance Cell',
                'escalation_levels': ['Local Office', 'District Collector', 'State Level'],
                'typical_timeline': '7-15 days',
                'required_documents': ['Complaint Application', 'ID Proof']
            })
            
            # Adjust timeline based on urgency
            urgency_level = urgency.get('urgency_level', 'medium')
            if urgency_level == 'high':
                resolution_info['priority_timeline'] = '1-3 days'
            elif urgency_level == 'low':
                resolution_info['priority_timeline'] = '15-30 days'
            
            suggestions = {
                'recommended_department': resolution_info['department'],
                'escalation_path': resolution_info['escalation_levels'],
                'estimated_timeline': resolution_info.get('priority_timeline', resolution_info['typical_timeline']),
                'required_documents': resolution_info['required_documents'],
                'next_steps': self.generate_next_steps(predicted_category, urgency_level),
                'contact_information': self.get_contact_info(predicted_category)
            }
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting resolution path: {str(e)}")
            return {
                'recommended_department': 'General Grievance Cell',
                'escalation_path': ['Local Office', 'District Office'],
                'estimated_timeline': '7-15 days',
                'required_documents': ['Complaint Application'],
                'next_steps': ['Submit formal complaint', 'Follow up regularly'],
                'contact_information': 'Contact local grievance cell'
            }
    
    def calculate_priority_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall priority score for the grievance"""
        try:
            score = 0.0
            
            # Urgency weight (40%)
            urgency = analysis.get('urgency_assessment', {})
            urgency_level = urgency.get('urgency_level', 'medium')
            urgency_weights = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
            score += urgency_weights.get(urgency_level, 0.6) * 0.4
            
            # Sentiment weight (30%)
            sentiment = analysis.get('sentiment_analysis', {})
            sentiment_polarity = sentiment.get('polarity', 0)
            # More negative sentiment = higher priority
            sentiment_score = max(0, (1 - (sentiment_polarity + 1) / 2))
            score += sentiment_score * 0.3
            
            # Emotion weight (20%)
            emotion = analysis.get('emotion_analysis', {})
            emotion_intensity = emotion.get('emotional_intensity', 'medium')
            emotion_weights = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
            score += emotion_weights.get(emotion_intensity, 0.6) * 0.2
            
            # Category weight (10%)
            category = analysis.get('category_prediction', {})
            high_priority_categories = ['healthcare', 'law_enforcement', 'infrastructure']
            category_name = category.get('predicted_category', '')
            if category_name in high_priority_categories:
                score += 0.1
            else:
                score += 0.05
            
            return min(score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating priority score: {str(e)}")
            return 0.5
    
    def generate_summary(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the grievance analysis"""
        try:
            category = analysis.get('category_prediction', {}).get('predicted_category', 'general')
            urgency = analysis.get('urgency_assessment', {}).get('urgency_level', 'medium')
            sentiment = analysis.get('sentiment_analysis', {}).get('primary_sentiment', 'neutral')
            priority_score = analysis.get('priority_score', 0.5)
            
            summary_text = f"This is a {category} grievance with {urgency} urgency level. "
            summary_text += f"The sentiment is {sentiment} with a priority score of {priority_score:.2f}. "
            
            # Add key insights
            insights = []
            
            if priority_score > 0.8:
                insights.append("High priority - requires immediate attention")
            elif priority_score < 0.3:
                insights.append("Low priority - can be handled in routine processing")
            
            entities = analysis.get('entity_extraction', {})
            if entities.get('contact_info', {}).get('phones'):
                insights.append("Contact information available for follow-up")
            
            emotion = analysis.get('emotion_analysis', {})
            if emotion.get('primary_emotion') in ['anger', 'sadness', 'fear']:
                insights.append("Strong emotional content - handle with empathy")
            
            return {
                'summary_text': summary_text,
                'key_insights': insights,
                'recommended_action': self.get_recommended_action(priority_score, urgency),
                'risk_level': self.assess_risk_level(analysis)
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {
                'summary_text': 'Grievance analysis completed',
                'key_insights': [],
                'recommended_action': 'Process normally',
                'risk_level': 'medium'
            }
    
    def calculate_sentiment_intensity(self, text: str) -> str:
        """Calculate the intensity of sentiment in the text"""
        intense_words = [
            'extremely', 'very', 'absolutely', 'completely', 'totally',
            'utterly', 'highly', 'severely', 'deeply', 'intensely'
        ]
        
        count = sum(1 for word in intense_words if word in text.lower())
        if count >= 3:
            return 'high'
        elif count >= 1:
            return 'medium'
        else:
            return 'low'
    
    def assess_emotional_intensity(self, emotions: Dict[str, float]) -> str:
        """Assess the emotional intensity based on emotion scores"""
        if not emotions:
            return 'medium'
        
        max_score = max(emotions.values())
        if max_score > 0.8:
            return 'high'
        elif max_score > 0.5:
            return 'medium'
        else:
            return 'low'
    
    def find_category_keywords(self, text: str) -> Dict[str, List[str]]:
        """Find category-specific keywords in the text"""
        matches = {}
        text_lower = text.lower()
        
        for category, keywords in self.grievance_categories.items():
            found_keywords = [kw for kw in keywords if kw in text_lower]
            if found_keywords:
                matches[category] = found_keywords
        
        return matches
    
    def get_category_description(self, category: str) -> str:
        """Get description for a category"""
        descriptions = {
            'administrative': 'Issues related to government administration and bureaucracy',
            'infrastructure': 'Problems with public infrastructure and utilities',
            'healthcare': 'Medical and health service related complaints',
            'education': 'Educational system and institution issues',
            'law_enforcement': 'Police and security related matters',
            'financial': 'Banking, pension, and financial service issues',
            'employment': 'Job and workplace related grievances',
            'environment': 'Environmental and pollution concerns',
            'social_welfare': 'Social schemes and welfare program issues',
            'utilities': 'Public utility service problems'
        }
        return descriptions.get(category, 'General grievance category')
    
    def estimate_response_time(self, urgency_level: str) -> str:
        """Estimate response time based on urgency"""
        times = {
            'high': '24-48 hours',
            'medium': '3-5 days',
            'low': '7-14 days'
        }
        return times.get(urgency_level, '3-5 days')
    
    def generate_next_steps(self, category: str, urgency: str) -> List[str]:
        """Generate next steps based on category and urgency"""
        common_steps = [
            'Submit formal complaint with all required documents',
            'Keep copies of all submitted documents',
            'Note down complaint/reference number',
            'Follow up regularly on progress'
        ]
        
        if urgency == 'high':
            common_steps.insert(0, 'Mark complaint as urgent/priority')
            common_steps.append('Consider contacting higher authorities if no response')
        
        category_specific = {
            'healthcare': ['Contact medical superintendent if hospital-related'],
            'law_enforcement': ['File FIR if criminal matter', 'Contact senior police officer'],
            'infrastructure': ['Report to local municipal office', 'Provide photo evidence'],
        }
        
        steps = common_steps + category_specific.get(category, [])
        return steps
    
    def get_contact_info(self, category: str) -> str:
        """Get contact information for specific categories"""
        contacts = {
            'administrative': 'District Collector Office or local administrative office',
            'healthcare': 'District Health Officer or Medical Superintendent',
            'infrastructure': 'Municipal Corporation or Public Works Department',
            'law_enforcement': 'Police Station or Superintendent of Police office',
            'education': 'District Education Officer or concerned school administration'
        }
        return contacts.get(category, 'Local Grievance Redressal Cell')
    
    def get_recommended_action(self, priority_score: float, urgency: str) -> str:
        """Get recommended action based on priority and urgency"""
        if priority_score > 0.8 or urgency == 'high':
            return 'Immediate action required - escalate to senior officer'
        elif priority_score > 0.5 or urgency == 'medium':
            return 'Process with standard priority - assign to appropriate officer'
        else:
            return 'Routine processing - handle in regular queue'
    
    def assess_risk_level(self, analysis: Dict[str, Any]) -> str:
        """Assess overall risk level of the grievance"""
        risk_factors = 0
        
        # High negative sentiment
        sentiment = analysis.get('sentiment_analysis', {})
        if sentiment.get('polarity', 0) < -0.5:
            risk_factors += 1
        
        # High urgency
        urgency = analysis.get('urgency_assessment', {})
        if urgency.get('urgency_level') == 'high':
            risk_factors += 1
        
        # Sensitive categories
        category = analysis.get('category_prediction', {})
        sensitive_categories = ['law_enforcement', 'healthcare']
        if category.get('predicted_category') in sensitive_categories:
            risk_factors += 1
        
        # Strong emotions
        emotion = analysis.get('emotion_analysis', {})
        if emotion.get('primary_emotion') in ['anger', 'fear']:
            risk_factors += 1
        
        if risk_factors >= 3:
            return 'high'
        elif risk_factors >= 2:
            return 'medium'
        else:
            return 'low'
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of the grievance analyzer"""
        return {
            'models_loaded': self.models_loaded,
            'available_features': [
                'sentiment_analysis',
                'emotion_detection',
                'category_prediction',
                'urgency_assessment',
                'entity_extraction',
                'language_analysis',
                'resolution_suggestions',
                'priority_scoring'
            ],
            'supported_categories': list(self.grievance_categories.keys()),
            'urgency_levels': ['high', 'medium', 'low'],
            'nlp_available': self.nlp is not None
        }

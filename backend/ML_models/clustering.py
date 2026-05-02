from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import pandas as pd
import numpy as np

def generate_job_clusters(job_data: pd.DataFrame, n_clusters: int = 5) -> pd.DataFrame:
    """
    Module 7: K-Means Clustering (Job Grouping)
    Groups similar job roles to identify alternative career paths using Scikit-Learn.
    
    Args:
        job_data (pd.DataFrame): Training set of historical jobs [id, title, description/skills text]
        n_clusters (int): The number of expected distinct career groupings.
        
    Returns:
        pd.DataFrame: Job Data now mapped with a `cluster_id` from KMeans.
    """
    
    # 1. Vectorize the jobs by skill requirement features
    tfidf_vectorizer = TfidfVectorizer(max_df=0.8, min_df=2, stop_words='english')
    # Combine title & required skills to construct document for clustering
    doc_strings = job_data['title'] + " " + job_data['required_skills_str']
    
    tfidf_matrix = tfidf_vectorizer.fit_transform(doc_strings)
    
    # 2. Fit the K-Means Model
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(tfidf_matrix)
    
    # 3. Use clusters for alternative paths
    cluster_labels = kmeans.labels_
    
    # Optional: Find the top terms mapped to each cluster to assign a label 
    # (e.g., 'Data Science', 'Frontend', 'Backend')
    
    # Assign back to dataframe
    job_data['cluster_id'] = cluster_labels
    
    return job_data

def find_nearby_careers(user_cluster_id: int, job_data: pd.DataFrame) -> pd.DataFrame:
    """
    Shows 'nearby careers' by filtering for roles falling into the user's matched cluster.
    """
    return job_data[job_data['cluster_id'] == user_cluster_id]

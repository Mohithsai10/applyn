from __future__ import annotations

import streamlit as st

st.set_page_config(page_title="Applyn", page_icon="📄", layout="wide")

st.title("Applyn — AI Job Application Agent")

with st.sidebar:
    st.header("Configuration")
    model = st.selectbox("Model", ["claude-sonnet-4-6", "claude-opus-4-7", "gpt-4o"])

col_left, col_right = st.columns(2)

with col_left:
    st.subheader("Resume")
    resume_text = st.text_area("Paste your resume here", height=400, key="resume")

with col_right:
    st.subheader("Job Description")
    jd_text = st.text_area("Paste the job description here", height=400, key="jd")

if st.button("Tailor Resume", type="primary", disabled=not (resume_text and jd_text)):
    st.info("Agent pipeline will run here")
